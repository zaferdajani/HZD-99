"""Render the owner's stat cards from the game's exported stats.json."""
import json, math
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'docs/combat/impact-2026-10-16'
OUT = ROOT / 'output/pdf/CLAWBYTE-Character-Cards.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
D = json.loads((DATA / 'stats.json').read_text())
for name, file in [('Regular','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name, '/usr/share/fonts/truetype/dejavu/' + file))
W,H=A4
BG='#0b111c'; PANEL='#152131'; LINE='#304257'; TEXT='#eff5ff'; MUTED='#a5b8ce'
C=canvas.Canvas(str(OUT),pagesize=A4)
C.setTitle('CLAWBYTE | Character Cards and Combat Ledger')
C.setAuthor('CLAWBYTE / VibeSolutions')

def txt(s,x,y,size=10,col=TEXT,bold=False):
    C.setFillColor(HexColor(col));C.setFont('Bold' if bold else 'Regular',size);C.drawString(x,y,str(s))

def lines(s,x,y,width,size=10,col=MUTED,leading=None,bold=False):
    leading=leading or size*1.45
    words=str(s).split();line=''
    for word in words:
        trial=(line+' '+word).strip()
        if pdfmetrics.stringWidth(trial,'Bold' if bold else 'Regular',size)>width and line:
            txt(line,x,y,size,col,bold);y-=leading;line=word
        else:line=trial
    if line:txt(line,x,y,size,col,bold);y-=leading
    return y

def page(n,title,sub=''):
    C.setFillColor(HexColor(BG));C.rect(0,0,W,H,fill=1,stroke=0)
    txt('CLAWBYTE',32,H-32,12,'#76e5ec',True)
    txt(title,32,H-58,19,TEXT,True)
    if sub:txt(sub,32,H-76,8,MUTED)
    C.setStrokeColor(HexColor(LINE));C.line(32,28,W-32,28)
    txt('COMBAT '+D['version']+'  /  BUILD '+D['build'],32,16,7,MUTED)
    txt(str(n),W-45,16,8,MUTED)

page(1,'Character field guide','37 illustrated cards / actual runtime values / 16 October 2026')
txt('EVERY HIT HAS WEIGHT.',32,H-126,24,TEXT,True)
lines('The robot kingdoms, their guardians and the hero who can bring them back.',32,H-154,W-64,12)
C.drawImage(ImageReader(str(DATA/'portraits/hero-claws.png')),60,390,width=475,height=317,mask='auto',preserveAspectRatio=True,anchor='c')
y=365
for title,body in [
 ('Read the units','The hero uses cores: 5 on Normal difficulty. Enemies use HP. An enemy ATK of 1 core removes one hero core before guard or protection. These are different authored units, not directly comparable health pools.'),
 ('Read attack speed','The hero card reports theoretical combo swings per second before impact pauses. Creature and boss cards report the actual authored cadence multiplier; movement, tells, cooldowns, range and phases determine the observed attack rate. A value of 1x does not mean one hit each second.'),
 ('A reference, not a balance certificate','Cards use Normal difficulty, a fresh save and no random traits or upgrades. Later kingdoms, difficulty, equipment and traits change live values. Portraits are captured from the game renderer; GRAVEHORN still uses its current procedural rig.')]:
    txt(title.upper(),32,y,10,'#76e5ec',True);y=lines(body,32,y-19,W-64,10)-19
C.showPage()

page(2,'Damage, defense and hit feel','The numbers behind the cards')
y=H-115
for title,body in [
 ('01 / Normal and charged attacks','Normal claw: 12 raw HP. Charged claw burst: 38 raw HP (3.2x base, rounded). Single sword: 20 normal / 51 charged burst. Dual swords: 24 normal / 18 per hurricane pass. Joined sword: 33 normal / 26 per outward and returning pass. Multi-hit specials are not a single doubled strike; their distinct authored moves are preserved.'),
 ('02 / Armor','Armor reduces incoming raw HP by a percentage before elemental and encounter modifiers: max(1, round(raw x (1 - DEF/100))). Example: 20 raw into 12% defense becomes 18 HP. Boss shields, exposed windows, critical hits and the Sage purification rules still apply. Armor never bypasses story protection.'),
 ('03 / Increasing resistance','Chassis defense is defined per creature. Kingdom armor adds A 0, B 2, C 4, D 6, E 8 and X 8 percentage points. Existing HP escalation remains. On Normal, NULLFANG has 329 HP and 8% DEF; MOTHER has 1,682 HP and 28% DEF. GRAVEHORN has two 329-HP phases.'),
 ('04 / Impact choreography','Normal contact: 45 ms white silhouette flash, five cosmetic metal fragments, existing impact sound, recoil and about 50 ms hit-stop. Heavy combo: 65 ms flash and nine fragments. Charged contact: 85 ms flash, fourteen fragments, stronger recoil/shake and 120 ms impact pause. Multi-hit specials only add the heavy pause on first contact.'),
 ('05 / Protection and accessibility','Blocked, protected and zero-damage contacts do not grant successful-hit knockback, charge or debris. NPCs have 100 protected integrity, zero attack and zero attack speed; they are not combat targets. Reduced-motion mode removes the new white silhouette flash and charged camera pause and reduces hardware debris.'),
 ('06 / Keep a record','Pause > Gear displays live hero stats. Select Export combat log, or press L in Gear, to download the latest 200 resolved hit records as JSON. The export includes build, weapon, room, raw damage, armor, HP lost and result. A local copy is saved on export or page exit. stats.json and this PDF are the versioned balance reference.')]:
    txt(title,32,y,12,'#76e5ec',True);y=lines(body,32,y-21,W-64,10)-18
C.showPage()

def card(r,x,y,w,h,i):
    accent='#76e5ec' if r['role']=='Hero' else '#e3bc70' if r['role']=='Protected NPC' else '#c19aff' if 'boss' in r['role'].lower() else '#f58b8f'
    C.setFillColor(HexColor(PANEL));C.setStrokeColor(HexColor(LINE));C.roundRect(x,y,w,h,12,fill=1,stroke=1)
    C.setFillColor(HexColor(accent));C.roundRect(x+14,y+h-23,26,3,1.5,fill=1,stroke=0)
    title=r['name'].replace(', THE VIRUS BEAST','').replace(', THE IRON EAGLE','')
    lines(title,x+14,y+h-43,w-28,12,TEXT,14,True)
    txt(r['role'].upper()+' / '+r['zone'],x+14,y+h-70,8,accent)
    C.drawImage(ImageReader(str(DATA/'portraits'/f"{r['id']}.png")),x+12,y+147,width=w-24,height=150,mask='auto',preserveAspectRatio=True,anchor='c')
    hero=r['role']=='Hero';npc=r['role']=='Protected NPC'
    vals=[('HEALTH',str(r['hpMax']), 'cores' if hero else 'protected integrity' if npc else 'HP'),
          ('ATTACK',str(r['attackPower']), 'raw HP / normal hit' if hero else 'cores / contact'),
          ('DEFENSE',str(r['defense'])+'%', 'protected' if npc else 'chassis armor'),
          ('ATTACK SPEED',str(r['attackSpeed'])+('' if hero else 'x'), 'swings / second' if hero else 'authored cadence')]
    for j,(label,value,unit) in enumerate(vals):
        xx=x+15+(j%2)*(w/2);yy=y+124-(j//2)*55
        txt(label,xx,yy,7.5,MUTED,True);txt(value,xx,yy-23,21,TEXT,True);txt(unit,xx,yy-35,7,MUTED)
    note=r.get('special') or r.get('note') or ('Friendly / cannot be attacked.' if npc else 'Stats vary with difficulty, traits and encounter state.')
    lines(note,x+14,y+23,w-28,7.2,MUTED,9)
    txt(f"{i+1:02d}",x+w-27,y+h-20,8,accent,True)

rows=D['rows'];cw=(W-82)/2;ch=348
for start in range(0,len(rows),4):
    page(3+start//4,'The machine roster',f"Cards {start+1:02d}-{min(start+4,len(rows)):02d} / Normal baseline")
    for j,r in enumerate(rows[start:start+4]):
        card(r,32+(j%2)*(cw+18),H-98-ch-(j//2)*(ch+18),cw,ch,start+j)
    C.showPage()
C.save()
print(OUT)
