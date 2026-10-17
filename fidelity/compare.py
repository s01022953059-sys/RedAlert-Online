"""Compare lossless, equal-size reference and candidate frames. Not a fidelity score."""
import argparse,json
from pathlib import Path
from PIL import Image, ImageChops

def compare(reference,candidate,diff):
 a=Image.open(reference).convert('RGB');b=Image.open(candidate).convert('RGB')
 if a.size!=b.size:raise ValueError(f'Resolution mismatch: {a.size} != {b.size}; resizing is forbidden')
 delta=ImageChops.difference(a,b)
 pixels=list(delta.getdata());changed=sum(any(v for v in p) for p in pixels)
 delta.save(diff)
 return {'width':a.width,'height':a.height,'changed_pixels':changed,'total_pixels':len(pixels),'exact_pixel_match_percent':100*(1-changed/len(pixels)),'mean_absolute_channel_error':sum(sum(p) for p in pixels)/(3*len(pixels)),'scope':'one RGB frame only; NOT overall game fidelity','diff':str(diff)}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('reference');p.add_argument('candidate');p.add_argument('--diff',required=True);a=p.parse_args()
 print(json.dumps(compare(a.reference,a.candidate,a.diff),indent=2))
