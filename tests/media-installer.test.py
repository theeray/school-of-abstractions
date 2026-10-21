import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import zipfile
from contextlib import redirect_stdout
from email.utils import formatdate
import io
from unittest.mock import Mock, patch
import urllib.error
import urllib.request

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

class Response(io.BytesIO):
 def __init__(self,data,url,headers=None):
  super().__init__(data);self.url=url;self.headers=headers or {}
 def geturl(self):return self.url

class ReferenceDownloadTests(unittest.TestCase):
 def setUp(self):
  # No live network and no sleeping: tests explicitly simulate the observed 429.
  self.quiet=redirect_stdout(io.StringIO());self.quiet.__enter__();self.addCleanup(self.quiet.__exit__,None,None,None)
  self.url=refs.SOURCES['michelangelo-pieta.jpg']['url']
 def error(self,status=429,headers=None):
  return urllib.error.HTTPError(self.url,status,'test',headers or {},None)
 def fixture(self):
  files={name:tiny_jpeg(*source['dimensions']) for name,source in refs.SOURCES.items()}
  records={name:{**refs.SOURCES[name],'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()} for name,data in files.items()}
  return files,records
 def test_retry_after_seconds(self):
  self.assertEqual(refs.retry_delay('47',0),47)
 def test_retry_after_http_date(self):
  self.assertEqual(refs.retry_delay(formatdate(1047,usegmt=True),0,now=1000),47)
 def test_missing_invalid_or_past_retry_after(self):
  self.assertEqual(refs.retry_delay(None,0),15)
  self.assertEqual(refs.retry_delay('nonsense',1),30)
  self.assertEqual(refs.retry_delay(formatdate(900,usegmt=True),0,now=1000),0)
 def test_long_cooldown_is_not_shortened(self):
  self.assertRaises(OSError,refs.retry_delay,'3600',0)
  self.assertRaises(OSError,refs.retry_delay,'9'*50,0)
 def test_429_then_success(self):
  op=Mock(side_effect=[self.error(headers={'Retry-After':'31'}),Response(b'ok',self.url)]);sleep=Mock()
  self.assertEqual(refs.download(self.url,100,refs.ORIGINAL_HOSTS,opener=op,sleeper=sleep),b'ok')
  self.assertEqual(op.call_count,2);sleep.assert_called_once_with(31)
 def test_retries_stop_at_four(self):
  op=Mock(side_effect=lambda *a,**k:self.raise_error());sleep=Mock()
  self.assertRaises(OSError,refs.download,self.url,100,refs.ORIGINAL_HOSTS,opener=op,sleeper=sleep)
  self.assertEqual(op.call_count,4);self.assertEqual([c.args[0] for c in sleep.call_args_list],[15,30,60])
 def raise_error(self):raise self.error()
 def test_404_is_not_retried(self):
  op=Mock(side_effect=self.error(404));sleep=Mock()
  self.assertRaises(OSError,refs.download,self.url,100,refs.ORIGINAL_HOSTS,opener=op,sleeper=sleep)
  self.assertEqual(op.call_count,1);sleep.assert_not_called()
 def test_retry_after_long_wait_stops_without_another_request(self):
  op=Mock(side_effect=self.error(headers={'Retry-After':'600'}));sleep=Mock()
  self.assertRaises(OSError,refs.download,self.url,100,refs.ORIGINAL_HOSTS,opener=op,sleeper=sleep)
  self.assertEqual(op.call_count,1);sleep.assert_not_called()
 def test_transient_connection_failure_can_recover(self):
  op=Mock(side_effect=[urllib.error.URLError('test'),Response(b'ok',self.url)]);sleep=Mock()
  self.assertEqual(refs.download(self.url,100,refs.ORIGINAL_HOSTS,opener=op,sleeper=sleep),b'ok')
  sleep.assert_called_once_with(15)
 def test_bad_start_url_is_never_requested(self):
  for url in ['http://upload.wikimedia.org/a','https://evil.example/a','https://user@upload.wikimedia.org/a','https://upload.wikimedia.org:444/a']:
   op=Mock()
   self.assertRaises(ValueError,refs.download,url,100,refs.ORIGINAL_HOSTS,opener=op)
   op.assert_not_called()
 def test_bad_redirect_is_rejected_before_request(self):
  handler=refs.ApprovedRedirects(refs.ORIGINAL_HOSTS);req=urllib.request.Request(self.url)
  self.assertRaises(ValueError,handler.redirect_request,req,None,302,'test',{},'https://evil.example/a')
 def test_bad_final_url_is_rejected(self):
  op=Mock(return_value=Response(b'ok','https://evil.example/a'))
  self.assertRaises(ValueError,refs.download,self.url,100,refs.ORIGINAL_HOSTS,opener=op)
 def test_size_limits(self):
  for response in [Response(b'x'*101,self.url),Response(b'x',self.url,{'Content-Length':'101'})]:
   op=Mock(return_value=response)
   self.assertRaises(ValueError,refs.download,self.url,100,refs.ORIGINAL_HOSTS,opener=op)
   self.assertEqual(op.call_count,1)
 def test_published_record_is_bound_to_original_source(self):
  _,records=self.fixture();name='michelangelo-pieta.jpg';record=records[name];source=refs.SOURCES[name]
  self.assertTrue(refs.valid_record(record,source))
  for key,value in [('url','https://evil.example/other.jpg'),('dimensions',[1,1]),('bytes',True),('sha256','broken')]:
   self.assertFalse(refs.valid_record({**record,key:value},source))
 def test_mirror_copy_requires_checksum_and_dimensions(self):
  files,records=self.fixture();name='michelangelo-pieta.jpg';source=refs.SOURCES[name]
  refs.verify_copy(files[name],source,records[name])
  self.assertRaises(ValueError,refs.verify_copy,files[name][:-1]+b'x',source,records[name])
  self.assertRaises(ValueError,refs.verify_copy,tiny_jpeg(1,1),source,records[name])
 def test_existing_verified_files_do_not_use_network(self):
  files,records=self.fixture()
  with tempfile.TemporaryDirectory() as temp,patch.object(refs,'ROOT',Path(temp)),patch.object(refs,'download') as get:
   for name,data in files.items():(Path(temp)/name).write_bytes(data)
   (Path(temp)/'sources.json').write_text(json.dumps(records))
   refs.main();get.assert_not_called()
 def test_verified_published_copies_avoid_wikimedia(self):
  files,records=self.fixture()
  def respond(url,*a,**kw):
   self.assertTrue(url.startswith(refs.PUBLISHED_ROOT))
   return json.dumps(records).encode() if url.endswith('sources.json') else files[url.rsplit('/',1)[1]]
  with tempfile.TemporaryDirectory() as temp,patch.object(refs,'ROOT',Path(temp)),patch.object(refs,'download',side_effect=respond) as get:
   refs.main();self.assertEqual(get.call_count,4)
   self.assertEqual(json.loads((Path(temp)/'sources.json').read_text()),records)
 def test_corrupt_mirror_falls_back_to_credited_original(self):
  files,records=self.fixture()
  def respond(url,*a,**kw):
   if url==refs.PUBLISHED_ROOT+'sources.json':return json.dumps(records).encode()
   if url.startswith(refs.PUBLISHED_ROOT):return b'not an image'
   return next(files[n] for n,s in refs.SOURCES.items() if s['url']==url)
  with tempfile.TemporaryDirectory() as temp,patch.object(refs,'ROOT',Path(temp)),patch.object(refs,'download',side_effect=respond) as get:
   refs.main();self.assertEqual(get.call_count,7)
   self.assertEqual(json.loads((Path(temp)/'sources.json').read_text()),records)
 def test_invalid_published_metadata_is_not_followed(self):
  for data in [b'<html>not json</html>',b'[]',b'{"evil.jpg":{"url":"https://evil.example"}}']:
   with patch.object(refs,'download',return_value=data) as get:
    self.assertEqual(refs.published_records(),{});self.assertEqual(get.call_count,1)
 def test_failed_third_image_preserves_verified_local_work(self):
  files,records=self.fixture();third='michelangelo-pieta.jpg'
  def respond(url,*a,**kw):
   if url==refs.PUBLISHED_ROOT+'sources.json':raise OSError('no previous release')
   name=next(n for n,s in refs.SOURCES.items() if s['url']==url)
   if name==third:raise OSError('HTTP 429')
   return files[name]
  with tempfile.TemporaryDirectory() as temp,patch.object(refs,'ROOT',Path(temp)),patch.object(refs,'download',side_effect=respond):
   self.assertRaises(OSError,refs.main)
   saved=json.loads((Path(temp)/'sources.json').read_text())
   self.assertEqual(len(saved),2);self.assertNotIn(third,saved)
   for name,record in saved.items():refs.verify_copy((Path(temp)/name).read_bytes(),refs.SOURCES[name],record)
 def test_symlinks_are_not_overwritten(self):
  with tempfile.TemporaryDirectory() as temp:
   base=Path(temp);outside=base/'outside';outside.write_bytes(b'keep');root=base/'media';root.mkdir()
   (root/'sources.json').symlink_to(outside)
   with patch.object(refs,'ROOT',root):self.assertRaises(ValueError,refs.main)
   self.assertEqual(outside.read_bytes(),b'keep')

if __name__=='__main__':unittest.main()
