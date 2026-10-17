"""Hash user-supplied game files locally. Does not execute or upload them."""
import argparse,hashlib,json
from pathlib import Path

def inventory(root):
 root=Path(root).resolve();files=[]
 for path in sorted(root.rglob('*')):
  if path.is_symlink() or not path.is_file() or path.suffix.lower() not in {'.exe','.mix','.ini','.dll','.vqa','.aud','.shp','.pcx','.pal','.fnt'}:continue
  if not path.resolve().is_relative_to(root):continue
  digest=hashlib.sha256()
  with path.open('rb') as f:
   for chunk in iter(lambda:f.read(1024*1024),b''):digest.update(chunk)
  files.append({'path':path.relative_to(root).as_posix(),'bytes':path.stat().st_size,'sha256':digest.hexdigest()})
 return {'files':files,'baseline_status':'unverified','note':'File names and hashes alone do not identify a retail version or prove completeness.'}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('directory');a=p.parse_args()
 if not Path(a.directory).is_dir():p.error('directory must exist')
 print(json.dumps(inventory(a.directory),indent=2))
