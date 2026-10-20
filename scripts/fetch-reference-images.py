#!/usr/bin/env python3
"""Download the three credited historical reference images; no account or API key."""
from pathlib import Path
import hashlib
import json
import os
import struct
import tempfile
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1] / 'public/art/reference-originals'
MAX_BYTES = 12_000_000
SOURCES = {
 'raphael-school-of-athens.jpg': {
  'url': 'https://upload.wikimedia.org/wikipedia/commons/6/68/Raffael_058.jpg',
  'dimensions': [6045,4671],
  'record': 'https://commons.wikimedia.org/wiki/File:Raffael_058.jpg',
  'credit': 'Raphael, The School of Athens. Public-domain reproduction, Wikimedia Commons / The Yorck Project. No image editing applied.'
 },
 'blake-ancient-of-days.jpg': {
  'url': 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Europe_a_Prophecy%2C_copy_D%2C_object_1_%28Bentley_1%2C_Erdman_i%2C_Keynes_i%29_British_Museum.jpg',
  'dimensions': [2975,4109],
  'record': 'https://commons.wikimedia.org/wiki/File:Europe_a_Prophecy,_copy_D,_object_1_(Bentley_1,_Erdman_i,_Keynes_i)_British_Museum.jpg',
  'credit': 'William Blake, The Ancient of Days, frontispiece to Europe a Prophecy, copy D (1794). Original in the British Museum. Public-domain reproduction via Wikimedia Commons / the William Blake Archive. No image editing applied.'
 },
 'michelangelo-pieta.jpg': {
  'url': 'https://upload.wikimedia.org/wikipedia/commons/1/1f/Michelangelo%27s_Pieta_5450_cropncleaned_edit.jpg',
  'dimensions': [1584,1660],
  'record': 'https://commons.wikimedia.org/wiki/File:Michelangelo%27s_Pieta_5450_cropncleaned_edit.jpg',
  'credit': 'Michelangelo, Pietà. Photograph by Stanislav Traykov, edited Commons version. CC BY 2.5: https://creativecommons.org/licenses/by/2.5/ . Background distractions were removed in the credited source version. No additional image editing applied.'
 }
}


def jpeg_dimensions(data):
    if not isinstance(data, bytes) or not data.startswith(b'\xff\xd8'):
        raise ValueError('Reference download is not a JPEG image.')
    pos = 2
    while pos < len(data):
        if data[pos] != 255:
            raise ValueError('Invalid JPEG marker.')
        while pos < len(data) and data[pos] == 255:
            pos += 1
        if pos >= len(data):
            break
        marker = data[pos]
        pos += 1
        if marker in (0xD9, 0xDA):
            break
        if marker in (0x01, 0xD8) or 0xD0 <= marker <= 0xD7:
            continue
        if pos + 2 > len(data):
            break
        size = int.from_bytes(data[pos:pos+2], 'big')
        if size < 2 or pos + size > len(data):
            raise ValueError('Invalid JPEG segment length.')
        if marker in (0xC0,0xC1,0xC2,0xC3,0xC5,0xC6,0xC7,0xC9,0xCA,0xCB,0xCD,0xCE,0xCF):
            if size < 8:
                break
            height, width = struct.unpack('>HH', data[pos+3:pos+7])
            if not width or not height:
                break
            return [width, height]
        pos += size
    raise ValueError('Reference JPEG dimensions could not be verified.')


def validate_image(data, dimensions):
    if len(data) < 10000 or len(data) > MAX_BYTES:
        raise ValueError('Unexpected reference image file size.')
    if jpeg_dimensions(data) != dimensions:
        raise ValueError('The reference image dimensions differ from the cited source.')
    return hashlib.sha256(data).hexdigest()


def main():
    ROOT.mkdir(parents=True, exist_ok=True)
    if ROOT.is_symlink():
        raise ValueError('Reference destination cannot be a symbolic link.')
    record_path = ROOT/'sources.json'
    existing = json.loads(record_path.read_text()) if record_path.is_file() else {}
    staged = {}
    # No local file is accepted merely because it has the expected name.
    for name, source in SOURCES.items():
        path = ROOT/name
        previous = existing.get(name, {})
        if path.is_file() and not path.is_symlink():
            data = path.read_bytes()
            digest = validate_image(data, source['dimensions'])
            if previous.get('sha256') == digest and previous.get('url') == source['url']:
                staged[name] = (data, {**source, 'bytes':len(data), 'sha256':digest})
                print('Verified existing reference:', name)
                continue
        req = urllib.request.Request(source['url'], headers={'User-Agent':'SchoolOfAbstractions/1.0 educational-image-reference'})
        with urllib.request.urlopen(req, timeout=60) as response:
            parsed = urllib.parse.urlparse(response.geturl())
            if parsed.scheme != 'https' or parsed.hostname not in ('upload.wikimedia.org','thumb.wikimedia.org'):
                raise ValueError('Unexpected reference download destination.')
            data = response.read(MAX_BYTES+1)
        digest = validate_image(data, source['dimensions'])
        staged[name] = (data, {**source, 'bytes':len(data), 'sha256':digest})
        print('Downloaded and checked:', name)
    for name, (data, _) in staged.items():
        with tempfile.NamedTemporaryFile(dir=ROOT, delete=False) as temp:
            temp.write(data)
            temporary = temp.name
        os.replace(temporary, ROOT/name)
    record_path.write_text(json.dumps({name:meta for name,(_,meta) in staged.items()},indent=2)+'\n')
    print('Three historical reference images are ready, with source credits and checksums. No deployment performed.')


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError) as error:
        raise SystemExit('Historical references are not fully verified: '+str(error)+'\nNo deployment was performed. Retry when the public image source is available.')
