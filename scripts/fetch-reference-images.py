#!/usr/bin/env python3
"""Prepare three credited reference images, reusing verified copies before the origin."""
from pathlib import Path
from email.utils import parsedate_to_datetime
import hashlib
import http.client
import json
import math
import os
import re
import struct
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1] / 'public/art/reference-originals'
MAX_BYTES = 12_000_000
MAX_METADATA_BYTES = 32_768
PUBLISHED_ROOT = 'https://school-of-abstractions.web.app/art/reference-originals/'
PUBLISHED_HOSTS = frozenset({'school-of-abstractions.web.app'})
ORIGINAL_HOSTS = frozenset({'upload.wikimedia.org', 'thumb.wikimedia.org'})
RETRY_CODES = frozenset({408, 429, 500, 502, 503, 504})
MAX_RETRY_WAIT = 120
USER_AGENT = 'SchoolOfAbstractions/1.1 (https://school-of-abstractions.web.app; educational-image-reference)'
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


def check_url(url, hosts):
    parsed = urllib.parse.urlsplit(url)
    if (parsed.scheme != 'https' or parsed.hostname not in hosts or
            parsed.username is not None or parsed.password is not None or
            parsed.port not in (None, 443)):
        raise ValueError('Unexpected reference download destination.')
    return parsed.hostname


class ApprovedRedirects(urllib.request.HTTPRedirectHandler):
    def __init__(self, hosts):
        self.hosts = hosts

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # Reject unapproved redirects BEFORE issuing the redirected request.
        check_url(newurl, self.hosts)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def retry_delay(value, attempt, now=None):
    """Honor Retry-After seconds/date; stop rather than retry earlier than requested."""
    delay = None
    if value:
        value = str(value).strip()
        if re.fullmatch(r'[0-9]+', value):
            if len(value) > 8:
                raise OSError('The server requests a long cooldown; retry this workflow later.')
            delay = int(value)
        else:
            try:
                parsed = parsedate_to_datetime(value)
                if parsed.tzinfo is not None:
                    delay = max(0, math.ceil(parsed.timestamp() - (time.time() if now is None else now)))
            except (TypeError, ValueError, OverflowError):
                pass
    if delay is None:
        delay = min(15 * (2 ** attempt), MAX_RETRY_WAIT)
    if delay > MAX_RETRY_WAIT:
        raise OSError('The server requests a long cooldown; retry this workflow later.')
    return delay


def download(url, limit, hosts, attempts=4, opener=None, sleeper=None):
    host = check_url(url, hosts)
    if not 1 <= attempts <= 4:
        raise ValueError('Unexpected retry count.')
    open_url = opener or urllib.request.build_opener(ApprovedRedirects(hosts)).open
    sleep = sleeper or time.sleep
    for attempt in range(attempts):
        req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
        try:
            with open_url(req, timeout=60) as response:
                check_url(response.geturl(), hosts)
                length = response.headers.get('Content-Length', '')
                if length.isdigit() and int(length) > limit:
                    raise ValueError('Reference response exceeds the size limit.')
                data = response.read(limit + 1)
                if len(data) > limit:
                    raise ValueError('Reference response exceeds the size limit.')
                return data
        except urllib.error.HTTPError as error:
            status = error.code
            wait = error.headers.get('Retry-After') if error.headers else None
            error.close()
            if status not in RETRY_CODES or attempt + 1 == attempts:
                raise OSError(f'HTTP {status} from {host}; no verified image received.') from None
            delay = retry_delay(wait, attempt)
            print(f'HTTP {status} from {host}; waiting {delay}s before retry {attempt + 2}/{attempts}.', flush=True)
        except (urllib.error.URLError, TimeoutError, ConnectionError, http.client.HTTPException):
            if attempt + 1 == attempts:
                raise OSError(f'Connection to {host} failed; no verified image received.') from None
            delay = retry_delay(None, attempt)
            print(f'Connection interrupted at {host}; waiting {delay}s before retry {attempt + 2}/{attempts}.', flush=True)
        sleep(delay)
    raise OSError('Reference download did not complete.')


def valid_record(record, source):
    return (isinstance(record, dict) and record.get('url') == source['url'] and
            record.get('dimensions') == source['dimensions'] and
            type(record.get('bytes')) is int and 10000 <= record['bytes'] <= MAX_BYTES and
            isinstance(record.get('sha256'), str) and
            re.fullmatch(r'[0-9a-f]{64}', record['sha256']) is not None)


def verify_copy(data, source, record):
    if not valid_record(record, source):
        raise ValueError('Reference checksum record does not match its credited source.')
    digest = validate_image(data, source['dimensions'])
    if len(data) != record['bytes'] or digest != record['sha256']:
        raise ValueError('Reference copy failed its byte-count or SHA256 check.')
    return digest


def published_records():
    # Trust only this project's HTTPS-published record, never a URL supplied by it.
    # A new/empty site simply falls back to the original Wikimedia sources.
    try:
        data = download(PUBLISHED_ROOT + 'sources.json', MAX_METADATA_BYTES,
                        PUBLISHED_HOSTS, attempts=2)
        records = json.loads(data)
        if not isinstance(records, dict):
            raise ValueError('Invalid published reference index.')
        return {name: records[name] for name, source in SOURCES.items()
                if valid_record(records.get(name), source)}
    except (OSError, ValueError):
        print('Published reference index unavailable or invalid; original-source fallback remains enabled.')
        return {}


def atomic_write(path, data):
    if path.is_symlink():
        raise ValueError('Reference destination cannot be a symbolic link.')
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as temp:
            temp.write(data)
            temporary = temp.name
        os.replace(temporary, path)
    finally:
        if temporary and os.path.exists(temporary):
            os.unlink(temporary)


def main():
    if ROOT.is_symlink():
        raise ValueError('Reference destination cannot be a symbolic link.')
    ROOT.mkdir(parents=True, exist_ok=True)
    record_path = ROOT / 'sources.json'
    if record_path.is_symlink():
        raise ValueError('Reference metadata cannot be a symbolic link.')
    try:
        existing = json.loads(record_path.read_bytes()) if record_path.is_file() else {}
    except (OSError, ValueError):
        existing = {}
    if not isinstance(existing, dict):
        existing = {}
    verified = {}
    published = None
    for name, source in SOURCES.items():
        path = ROOT / name
        if path.is_symlink():
            raise ValueError('Reference image cannot be a symbolic link: ' + name)
        data = None
        if path.is_file() and path.stat().st_size <= MAX_BYTES:
            try:
                candidate = path.read_bytes()
                verify_copy(candidate, source, existing.get(name))
                data = candidate
                print('Verified existing reference:', name)
            except (OSError, ValueError):
                print('Local copy needs replacement:', name)
        if data is None:
            if published is None:
                published = published_records()
            record = published.get(name)
            if record:
                try:
                    candidate = download(PUBLISHED_ROOT + name, MAX_BYTES, PUBLISHED_HOSTS, attempts=2)
                    verify_copy(candidate, source, record)
                    data = candidate
                    print('Reused verified published reference:', name)
                except (OSError, ValueError):
                    print('Published copy unavailable or invalid; trying credited original:', name)
        if data is None:
            data = download(source['url'], MAX_BYTES, ORIGINAL_HOSTS)
            validate_image(data, source['dimensions'])
            print('Downloaded and checked original:', name)
        digest = validate_image(data, source['dimensions'])
        # Preserve the original source URL, credits and existing metadata format.
        verified[name] = {**source, 'bytes': len(data), 'sha256': digest}
        atomic_write(path, data)
        # Save successful work after each file. Deployment still requires all three.
        atomic_write(record_path, (json.dumps(verified, indent=2) + '\n').encode('utf-8'))
    print('Three historical reference images are ready, with source credits and checksums. No deployment performed.')


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError) as error:
        raise SystemExit('Historical references are not fully verified: ' + str(error) +
                         '\nNo deployment was performed. Retry when the credited image source is available.')
