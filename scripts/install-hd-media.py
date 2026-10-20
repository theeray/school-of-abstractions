#!/usr/bin/env python3
"""Install only the verified exhibition media; never sign in or deploy."""
from pathlib import Path, PurePosixPath
import argparse
import hashlib
import json
import shutil
import tempfile
import zipfile

EXPECTED = '40866289cbeac4a957c8efef9a19e372279f16cdf94e196859c104750de42478'
PREFIX = 'public/art/hd-v1/'
ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / PREFIX


def digest(data):
    return hashlib.sha256(data).hexdigest()


def parse_manifest(data, expected=EXPECTED):
    if digest(data) != expected:
        raise ValueError('This media manifest does not match the prepared release.')
    manifest = json.loads(data)
    if (manifest['source']['width'], manifest['source']['height']) != (9000, 6000):
        raise ValueError('Unexpected source dimensions.')
    for name, info in manifest['files'].items():
        p = PurePosixPath(name)
        if p.is_absolute() or '..' in p.parts or '\\' in name or str(p) != name:
            raise ValueError('Unsafe media path.')
        if not isinstance(info['bytes'], int) or not 0 < info['bytes'] < 32_000_000:
            raise ValueError('Unexpected media size.')
    if sum(i['bytes'] for i in manifest['files'].values()) > 64_000_000:
        raise ValueError('Media package exceeds the expected size limit.')
    return manifest


def verify_directory(directory, expected=EXPECTED):
    directory = Path(directory)
    m = parse_manifest((directory / 'manifest.json').read_bytes(), expected)
    for name, info in m['files'].items():
        p = directory / name
        if not p.is_file() or p.is_symlink() or p.stat().st_size != info['bytes']:
            raise ValueError('Missing or incorrect media file: ' + name)
        if digest(p.read_bytes()) != info['sha256']:
            raise ValueError('Media checksum mismatch: ' + name)
    return len(m['files'])


def unpack_archive(archive, destination, expected=EXPECTED):
    destination = Path(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.is_symlink():
        raise ValueError('The media destination must not be a symbolic link.')
    # Complete validation happens before replacing any existing media.
    with zipfile.ZipFile(archive) as z:
        names = z.namelist()
        if len(names) != len(set(names)):
            raise ValueError('Duplicate archive paths.')
        manifest_bytes = z.read(PREFIX + 'manifest.json')
        m = parse_manifest(manifest_bytes, expected)
        required = {PREFIX + name for name in m['files']} | {PREFIX + 'manifest.json'}
        if set(names) != required:
            raise ValueError('The archive contains missing or unexpected files.')
        stage = Path(tempfile.mkdtemp(prefix='.hd-staging-', dir=destination.parent))
        backup = None
        try:
            for name, info in m['files'].items():
                entry = z.getinfo(PREFIX + name)
                if entry.file_size != info['bytes'] or ((entry.external_attr >> 16) & 0o170000) == 0o120000:
                    raise ValueError('Invalid media archive entry: ' + name)
                data = z.read(entry)
                if digest(data) != info['sha256']:
                    raise ValueError('Media checksum mismatch: ' + name)
                target = stage / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
            (stage / 'manifest.json').write_bytes(manifest_bytes)
            verify_directory(stage, expected)
            if destination.exists():
                backup = Path(tempfile.mkdtemp(prefix='.hd-backup-', dir=destination.parent))
                backup.rmdir()
                destination.rename(backup)
            stage.rename(destination)
            if backup:
                shutil.rmtree(backup)
        except Exception:
            if backup and backup.exists() and not destination.exists():
                backup.rename(destination)
            raise
        finally:
            if stage.exists():
                shutil.rmtree(stage)
    return len(m['files'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', nargs='?', type=Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    try:
        if args.check:
            count = verify_directory(DESTINATION)
            print(f'High-resolution media verified locally: {count} files, 9,000 × 6,000 master.')
        elif args.archive:
            count = unpack_archive(args.archive.expanduser(), DESTINATION)
            print(f'Installed and verified {count} media files. No cloud changes or deployment performed.')
        else:
            parser.error('Supply the downloaded media ZIP, or use --check.')
    except (OSError, ValueError, KeyError, zipfile.BadZipFile) as exc:
        raise SystemExit('Media not ready: ' + str(exc) + '\nUse the supplied School-of-Abstractions-HD-Update.zip; do not upload credentials.')


if __name__ == '__main__':
    main()
