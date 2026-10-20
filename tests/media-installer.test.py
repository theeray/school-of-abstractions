import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

ROOT=Path(__file__).resolve().parents[1]
def load(path,name):
 spec=importlib.util.spec_from_file_location(name,ROOT/path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
install=load('scripts/install-hd-media.py','media_install')
refs=load('scripts/fetch-reference-images.py','reference_fetch')

def tiny_jpeg(width=2975,height=4109):
 # Minimal SOF marker for parser testing; not a rendered image fixture.
 return b'\xff\xd8\xff\xc0\x00\x11\x08'+height.to_bytes(2,'big')+width.to_bytes(2,'big')+b'\x03\x01\x11\x00\x02\x11\x00\x03\x11\x00'+b'0'*10000+b'\xff\xd9'

class SafeMediaTests(unittest.TestCase):
 def fixture(self,badname=False):
  path='../outside.jpg' if badname else 'preview.jpg';b=b'test media'
  m={'source':{'width':9000,'height':6000},'files':{path:{'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}}}
  raw=json.dumps(m).encode();return raw,hashlib.sha256(raw).hexdigest(),path,b
 def test_correct_manifest(self):
  raw,digest,_,_=self.fixture();self.assertEqual(install.parse_manifest(raw,digest)['source']['width'],9000)
 def test_wrong_manifest(self):
  raw,_,_,_=self.fixture();self.assertRaises(ValueError,install.parse_manifest,raw,'0'*64)
 def test_traversal(self):
  raw,digest,_,_=self.fixture(True);self.assertRaises(ValueError,install.parse_manifest,raw,digest)
 def test_install_and_check(self):
  raw,digest,name,b=self.fixture()
  with tempfile.TemporaryDirectory() as d:
   z=Path(d)/'media.zip';out=Path(d)/'out'
   with zipfile.ZipFile(z,'w') as f:f.writestr(install.PREFIX+'manifest.json',raw);f.writestr(install.PREFIX+name,b)
   self.assertEqual(install.unpack_archive(z,out,digest),1);self.assertEqual(install.verify_directory(out,digest),1)
 def test_missing_file_rejected(self):
  raw,digest,_,_=self.fixture()
  with tempfile.TemporaryDirectory() as d:
   z=Path(d)/'media.zip'
   with zipfile.ZipFile(z,'w') as f:f.writestr(install.PREFIX+'manifest.json',raw)
   self.assertRaises(ValueError,install.unpack_archive,z,Path(d)/'out',digest)
 def test_bad_content_rejected(self):
  raw,digest,name,_=self.fixture()
  with tempfile.TemporaryDirectory() as d:
   z=Path(d)/'media.zip';out=Path(d)/'out';out.mkdir();(out/'preserve.txt').write_text('previous')
   with zipfile.ZipFile(z,'w') as f:f.writestr(install.PREFIX+'manifest.json',raw);f.writestr(install.PREFIX+name,b'bad')
   self.assertRaises(ValueError,install.unpack_archive,z,out,digest);self.assertEqual((out/'preserve.txt').read_text(),'previous')
 def test_jpeg_dimensions(self):self.assertEqual(refs.jpeg_dimensions(tiny_jpeg()),[2975,4109])
 def test_not_an_image(self):self.assertRaises(ValueError,refs.jpeg_dimensions,b'<html>error</html>')
 def test_wrong_dimensions(self):self.assertRaises(ValueError,refs.validate_image,tiny_jpeg(),[6045,4671])
 def test_truncated_jpeg(self):self.assertRaises(ValueError,refs.jpeg_dimensions,b'\xff\xd8\xff\xc0\x00\xffbroken')
 def test_valid_image_hash(self):self.assertEqual(len(refs.validate_image(tiny_jpeg(),[2975,4109])),64)
 def test_reference_sources(self):
  self.assertEqual(len(refs.SOURCES),3)
  for source in refs.SOURCES.values():
   self.assertTrue(source['url'].startswith('https://upload.wikimedia.org/'));self.assertIn('credit',source)
if __name__=='__main__':unittest.main()
