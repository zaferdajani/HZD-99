# Keys a fired sheet of HZD-99 whose backdrop came back as a pale fog (or clean alpha):
# a flood from the border through faint or pale-unsaturated pixels (her dark outline
# stops it), small specks dropped, and any light rim outside her outline removed —
# the ledger: no light round any body. Used for the held-roll sheets (2026-11-22).
#   python tools/keyheld.py <fired.png> <keyed.png>
# keys a fired sheet of her: the backdrop (whatever the model left: opaque fog or
# clean alpha) goes by a flood from the border, small specks go, and a LIGHT RIM
# outside her dark outline goes too (the ledger: no light round any body)
import sys
from PIL import Image, ImageFilter, ImageDraw
import numpy as np
from scipy import ndimage
def key(fin, fout):
    src=np.array(Image.open(fin).convert('RGBA'))
    a=src[...,3].astype(int)
    border=np.concatenate([a[:40].ravel(),a[-40:].ravel()])
    thr=max(120, min(241, int(np.percentile(border,99))+40))
    rgb0=src[...,:3].astype(int); l0=(rgb0*[0.3,0.59,0.11]).sum(-1); s0=rgb0.max(-1)-rgb0.min(-1)
    # backdrop candidates: faint, or a pale unsaturated fog the model painted in; her
    # dark outline is what stops the flood at her edge
    cand=(a<=thr) | ((l0>212) & (s0<26))
    m=Image.fromarray(((~cand)*255).astype('uint8'))
    W,H=m.size; f=m.copy()
    for seed in [(0,0),(W-1,0),(0,H-1),(W-1,H-1),(W//2,0),(W//2,H-1)]:
        if f.getpixel(seed)==0: ImageDraw.floodfill(f, seed, 128)
    body=np.array(f)!=128
    # the light rim: in the outer 4 px of the silhouette, anything near-white is halo
    rgb=src[...,:3].astype(int); luma=(rgb*[0.3,0.59,0.11]).sum(-1); sat=rgb.max(-1)-rgb.min(-1)
    band=body & ~ndimage.binary_erosion(body, iterations=4)
    body=body & ~(band & (luma>200) & (sat<40))
    body=ndimage.binary_opening(body, iterations=1)
    lab,n=ndimage.label(body); sizes=ndimage.sum(body,lab,range(1,n+1))
    body=np.isin(lab,[i+1 for i,s in enumerate(sizes) if s>=400])
    bm=Image.fromarray((body*255).astype('uint8')).filter(ImageFilter.GaussianBlur(0.7))
    alpha=np.array(bm)
    out=src.copy().astype(float); out[...,3]=alpha
    ring=(alpha>0)&(alpha<245); out[ring,:3]*=0.6
    Image.fromarray(out.astype('uint8'),'RGBA').save(fout)
    return thr
if __name__=='__main__': print(key(sys.argv[1], sys.argv[2]))
