#!/usr/bin/env python3
"""Extract the owner's irregular 1536x1024 CLAWBYTE sheet, not an assumed grid.
Original source and registration data are retained. No new frames are generated.
"""
from __future__ import annotations
import argparse, hashlib, json, math
from pathlib import Path
from PIL import Image
import numpy as np
SOURCE_HASH = 'd1bb15f7b09a2f728f70266b47acb414b13579e1d66b39e3a06fc8c091603c97'
CELL_W, CELL_H, AX, GROUND_Y, AIR_Y = 256, 256, 128, 192, 128
GROUPS = {}
def group(name, bounds, ys, roots, feet=None, air=False):
    assert len(bounds) == len(roots)+1, name
    GROUPS[name] = [{'rect':[bounds[i],ys[0],bounds[i+1]-bounds[i],ys[1]-ys[0]],
                    'root_x':roots[i], 'root_y':feet[i] if isinstance(feet,list) else feet,
                    'anchor':'center' if air else 'feet'} for i in range(len(roots))]
group('idle',[615,699,783,868,955,1040,1127,1211,1298],(30,104),[661,742,824,909,997,1081,1167,1254])
group('run_reference',[18,112,202,288,377,463,550,640,748],(156,233),[73,158,245,332,418,504,591,684])
group('walk_reference',[779,865,950,1036,1123,1208,1295,1380,1494],(154,234),[817,902,989,1076,1162,1249,1335,1423])
group('jump',[15,107,190,273,350,428,512,596],(283,381),[61,140,221,303,389,464,550],air=True)
group('fall_land',[617,709,797,881,963,1049,1126],(280,381),[668,754,838,916,998,1085])
group('dash',[1140,1250,1375,1518],(305,380),[1185,1317,1486],air=True)
group('jab',[18,98,177,256,337,437],(435,513),[57,129,205,285,379])
group('double',[460,548,634,718,810,898,1024],(434,513),[495,579,660,746,841,938])
group('upper',[1040,1112,1186,1261,1339,1424,1518],(427,514),[1071,1144,1218,1300,1381,1472])
group('heavy',[16,101,207,317,419,525,638,747,851,965,1090,1208,1333,1413,1521],(565,668),[44,136,246,350,455,564,675,789,892,1009,1136,1249,1362,1470])
group('air_attack',[705,777,844,909,975,1044,1117],(729,820),[741,811,877,940,1009,1079],air=True)
group('plunge',[1135,1197,1260,1323,1395,1465,1518],(733,821),[1161,1228,1287,1355,1424,1494],air=True)
group('hurt',[18,65,109,155,199,241],(900,973),[43,85,130,175,222])
group('death',[254,300,343,384,424,466,501],(900,973),[275,321,365,402,446,485])
group('guard',[516,564,616,668,713],(897,972),[541,591,642,693])
group('idle_variations',[722,786,839,895,959,1010,1054],(896,973),[756,813,867,940,989,1033])
# Remove overlapping title bars rather than drawing UI labels above the hero.
for name, ordinal, top in [('jump',0,302),('fall_land',0,297),('upper',0,438),('upper',1,435),('upper',2,438)]:
    f=GROUPS[name][ordinal]; old_y=f['rect'][1];f['rect'][1]=top;f['rect'][3]-=top-old_y
# Shared painted contact lines preserve compression and authored uppercut lift.
for name,contact_y in {'idle':102,'run_reference':231,'walk_reference':232,'fall_land':375,
                      'jab':508,'double':508,'upper':511,'heavy':662,'hurt':970,
                      'death':970,'guard':970,'idle_variations':970}.items():
    for f in GROUPS[name]: f['root_y']=contact_y

def main():
    p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('output',type=Path)
    args=p.parse_args();blob=args.source.read_bytes()
    if hashlib.sha256(blob).hexdigest()!=SOURCE_HASH: raise ValueError('Not the approved original sheet')
    image=Image.open(args.source).convert('RGBA')
    if image.size!=(1536,1024):raise ValueError('Unexpected source dimensions')
    args.output.mkdir(parents=True,exist_ok=True)
    manifest={'source_share':'https://chatgpt.com/s/m_6aa84bf00514819189f0346b47f8e176',
              'source_sha256':SOURCE_HASH,'cell':[CELL_W,CELL_H],'anchor_x':AX,
              'ground_anchor_y':GROUND_Y,'air_anchor_y':AIR_Y,'scale_world_per_source_pixel':0.68,
              'alpha_preparation':'Source RGBA; alpha <=24 removed, remainder remapped to 255 at 253. No frame generation.',
              'clips':{},'frames':[]}
    count=sum(map(len,GROUPS.values()));cols=12;rows=math.ceil(count/cols)
    atlas=Image.new('RGBA',(cols*CELL_W,rows*CELL_H),(0,0,0,0));index=0
    for name,frames in GROUPS.items():
        indices=[]
        for ordinal,f in enumerate(frames):
            x,y,w,h=f['rect'];pixels=np.asarray(image.crop((x,y,x+w,y+h))).copy()
            a=pixels[:,:,3].astype(float);pixels[:,:,3]=np.clip((a-24)*(255/229),0,255).astype('uint8')
            # Register the warm/neutral opaque body, not a cyan slash or a label.
            xx=np.arange(w)[None,:];r=pixels[:,:,0].astype(float);b=pixels[:,:,2].astype(float)
            mask=(pixels[:,:,3]>165)&(r>50)&(r>=b*.85)&(abs(xx-(f['root_x']-x))<=22)
            points=np.argwhere(mask)
            if len(points)<18 and name not in ('heavy','death','plunge'):
                raise ValueError(f'Body registration unavailable: {name}:{ordinal}')
            if f['root_y'] is not None:root_y=f['root_y']
            elif len(points):
                if f['anchor']=='center':root_y=y+(float(np.quantile(points[:,0],.04))+float(np.quantile(points[:,0],.97)))/2
                else:root_y=y+float(np.quantile(points[:,0],.997))+1
            else:root_y=y+h-4
            ry=AIR_Y if f['anchor']=='center' else GROUND_Y
            tile=Image.new('RGBA',(CELL_W,CELL_H),(0,0,0,0))
            dx=int(round(AX-(f['root_x']-x)));dy=int(round(ry-(root_y-y)))
            if dx<0 or dy<0 or dx+w>CELL_W or dy+h>CELL_H:
                raise ValueError(f'Cell would clip source: {name}:{ordinal}, {(dx,dy,w,h)}')
            tile.paste(Image.fromarray(pixels),(dx,dy));cx=(index%cols)*CELL_W;cy=(index//cols)*CELL_H
            atlas.paste(tile,(cx,cy))
            manifest['frames'].append({'id':index,'clip':name,'ordinal':ordinal,'source':f['rect'],
                'source_anchor':[f['root_x'],round(root_y,3)],'anchor':f['anchor'],
                'atlas':[cx,cy,CELL_W,CELL_H],
                'body_center_y':round(dy+(float(np.quantile(points[:,0],.04))+float(np.quantile(points[:,0],.97)))/2,3) if len(points) else ry,
                'alpha_bbox':tile.getbbox()})
            indices.append(index);index+=1
        manifest['clips'][name]=indices
    manifest['coverage']={
        'protected_existing':['walk','run','wall_cling','idle_fidget','single_sword','dual_sword','joined_weapon','heal','song'],
        'reason':'Working walk/run protected by owner. Sheet lacks wall-cling, foot-tap/Yalla, heal/song and weapon-specific sequences.',
        'concept_only':['guard','idle_variations'],
        'fx_only':[['heavy',13],['death',4],['death',5],['plunge',5]],
        'not_a_rename':'CLAWBYTE stays CLAWBYTE; no new story, mechanic or weapon progression.'}
    atlas.save(args.output/'atlas.webp','WEBP',lossless=True,method=6)
    manifest['atlas_sha256']=hashlib.sha256((args.output/'atlas.webp').read_bytes()).hexdigest()
    (args.output/'frames.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (args.output/'frames.js').write_text('const OWNER_HERO_SHEET = Object.freeze('+json.dumps(manifest,separators=(',',':'))+');\n')
    print(json.dumps({'frames':count,'atlas_dimensions':atlas.size,'atlas_sha256':manifest['atlas_sha256'],
                      'bytes':(args.output/'atlas.webp').stat().st_size},indent=2))
if __name__=='__main__':main()
