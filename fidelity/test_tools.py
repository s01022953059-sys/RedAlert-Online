import tempfile,unittest
from pathlib import Path
from PIL import Image
from compare import compare
from inventory import inventory
class Tests(unittest.TestCase):
 def test_exact_and_one_pixel(self):
  with tempfile.TemporaryDirectory() as t:
   a=Path(t)/'a.png';b=Path(t)/'b.png';d=Path(t)/'diff.png'
   im=Image.new('RGB',(100,100));im.save(a);im.save(b)
   self.assertEqual(compare(a,b,d)['changed_pixels'],0)
   im.putpixel((0,0),(255,0,0));im.save(b)
   r=compare(a,b,d);self.assertEqual(r['changed_pixels'],1);self.assertEqual(r['exact_pixel_match_percent'],99.99)
 def test_resolution_mismatch(self):
  with tempfile.TemporaryDirectory() as t:
   a=Path(t)/'a.png';b=Path(t)/'b.png';Image.new('RGB',(1,1)).save(a);Image.new('RGB',(2,1)).save(b)
   with self.assertRaises(ValueError):compare(a,b,Path(t)/'d.png')
 def test_hashes_and_no_symlinks(self):
  with tempfile.TemporaryDirectory() as t:
   p=Path(t);(p/'RA95.EXE').write_bytes(b'abc');(p/'link.exe').symlink_to(p/'RA95.EXE');r=inventory(p)
   self.assertEqual(len(r['files']),1);self.assertEqual(r['files'][0]['sha256'],'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
if __name__=='__main__':unittest.main()
