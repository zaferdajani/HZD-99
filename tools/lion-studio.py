"""Deterministic delivery of reviewed Higgsfield lion takes; no generated pixels.

Extract actual video frames, remove only border-connected black, retain one
scale for each take, and remove filmed vertical root motion (physics owns it).
The standing frame fits a 320x210px envelope; each take keeps one scale.

ONE ANIMAL ACROSS EVERY TAKE (2026-11-13). Each take is its own generation, so
each came back with its own exposure and its own white balance: the armour's
mean colour ran from (106,96,101) on the pounce to (148,137,143) on the roar,
and the lion changed colour at every cut between states. --grade matches a
take to ONE reference look. The transform is measured ONCE per take, on its
standing rest frame (the same pose in every take, so the statistics compare
like with like) and applied to every frame of it, so a contact flash or a
shadow the take filmed on purpose is not flattened. --make-grade writes the
reference from a take; --grade reads it.

And each take is centred on its own ENVELOPE (so an extended paw never clips),
which puts the standing animal at a different x in every take's cells. The
standing frame's centre is recorded as `anchor` (cell px from the cell's
centre) so the renderer can put the same animal on the same spot at a cut.
`feet` is the per-cell extent of the sole rows, which is what the leap's
horizontal root motion is measured from.
"""
import argparse
import io
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

p = argparse.ArgumentParser()
p.add_argument('source')
p.add_argument('output')
p.add_argument('--frames', type=int, default=30)
p.add_argument('--start', type=float, default=0)
p.add_argument('--end', type=float, default=6)
p.add_argument('--threshold', type=int, default=48)
p.add_argument('--strict-borders', action='store_true')
p.add_argument('--foot-right', action='store_true', help='register on hind paws, excluding a filmed forepaw flash')
p.add_argument('--times', help='comma-separated sample times, overriding --frames/--start/--end (re-deriving a delivered strip)')
p.add_argument('--rest', type=float, default=0.08, help='time of the standing rest frame')
p.add_argument('--make-grade', help='write the reference look (armour statistics of the rest frame) and exit')
p.add_argument('--grade', help='reference look to match this take to')
p.add_argument('--regrade-strip', type=int, metavar='CELLS', help='SOURCE is a delivered strip of this many cells, not a take: match its grade to --grade (cell 0 is its rest frame) and write OUTPUT. For a take whose keying cannot be reproduced from the master.')
p.add_argument('--min-coverage', type=float, default=.5, help='smallest cell as a share of the largest; a turn through the front legitimately halves the silhouette')
p.add_argument('--drift', action='store_true', help='remove the linear horizontal drift between the first and last cell (a turn filmed off-centre ends where it began)')
args = p.parse_args()

QUANTILES = [1, 5, 15, 30, 50, 70, 85, 95, 99]
def look(im):
    return look_many([im])

def look_many(ims):
    """The plating's tone curve: per-channel quantiles of every opaque,
    UNSATURATED pixel. The violet lights are left out (they are emissive and a
    take may light them differently on purpose); the black joints and the
    blown highlights are kept, because they pin the two ends of the curve —
    a mean over 'mid-exposed' pixels only reads an overexposed take as normal."""
    # EVERY frame of the take, not its first: a take's exposure drifts as it
    # plays (the swipe opened 7 points brighter than its own rest frame), and a
    # curve read off one frame matches that frame and nothing after it.
    parts = []
    for im in ims:
        a = np.asarray(im).astype(np.float64)
        rgb, alpha = a[:, :, :3], a[:, :, 3]
        parts.append(rgb[(alpha > 200) & (rgb.max(axis=2) - rgb.min(axis=2) < 44)][::3])
    px = np.concatenate(parts)
    return dict(quantiles=QUANTILES,
                curve=[[round(float(v), 2) for v in np.percentile(px[:, c], QUANTILES)] for c in range(3)],
                mean=[round(float(v), 2) for v in px.mean(axis=0)], pixels=int(len(px)))

def curve_lut(own, ref):
    lut = np.zeros((3, 256), dtype=np.uint8)
    for ch3 in range(3):
        # a monotone curve through the matched quantiles, pinned at both ends
        xs = [0] + list(own['curve'][ch3]) + [255]; ys = [0] + list(ref['curve'][ch3]) + [255]
        xs = np.maximum.accumulate(np.array(xs) + np.arange(len(xs)) * 1e-3)
        lut[ch3] = np.clip(np.interp(np.arange(256), xs, ys), 0, 255).round()
    return lut

def regrade_with(lut, im):
    a = np.asarray(im).copy()
    for ch3 in range(3): a[:, :, ch3] = lut[ch3][a[:, :, ch3]]
    return Image.fromarray(a, 'RGBA')

if args.regrade_strip:
    strip = Image.open(args.source).convert('RGBA')
    cw0 = strip.width // args.regrade_strip
    ref, own = json.loads(Path(args.grade).read_text()), look(strip)
    done = regrade_with(curve_lut(own, ref), strip)
    out = Path(args.output); done.save(out, quality=92, method=6)
    meta_path = out.with_suffix('.motion.json')
    meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
    meta['grade'] = dict(reference=args.grade, takeMean=own['mean'], target=ref['mean'],
        after=look(done)['mean'], method='delivered strip regraded; master keying not reproducible')
    meta_path.write_text(json.dumps(meta, indent=2) + '\n')
    print(json.dumps(dict(output=str(out), bytes=out.stat().st_size, grade=meta['grade']))); raise SystemExit

def frame(t):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-ss', str(t),
        '-i', args.source, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'])
    a = np.array(Image.open(io.BytesIO(raw)).convert('RGB'))
    dark = a.max(axis=2) < args.threshold
    seeds = np.zeros(dark.shape, dtype=bool)
    seeds[0] = dark[0]; seeds[-1] = dark[-1]
    seeds[:, 0] = dark[:, 0]; seeds[:, -1] = dark[:, -1]
    field = ndimage.binary_propagation(seeds, mask=dark)
    labels, n = ndimage.label(~field)
    sizes = np.bincount(labels.ravel()); sizes[0] = 0
    # Dark joints can separate bright armour islands. Keep substantial enclosed
    # islands, rejecting edge-connected studio light and tiny dust motes.
    keep = sizes >= 48
    edge = np.unique(np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1])))
    # A contact flash may join the animal to an edge. Preserve a component
    # containing substantial bright armour; reject standalone border light.
    bright = np.bincount(labels[a.max(axis=2) > 140], minlength=n+1)
    for label in edge:
        if args.strict_borders or bright[label] < 12000: keep[label] = False
    keep[0] = False
    subject = ndimage.binary_fill_holes(keep[labels])
    # THE BODY'S OWN DARK IS BODY (owner, 2026-11-14: "feels like Nullfang is
    # translucent"). The key above calls anything darker than --threshold
    # background if a dark path joins it to the border — and a machine lion has
    # dark INSIDES: the shoulder socket behind a raised foreleg, the far legs,
    # the underside of the chest. Lit at 10-40 they sit under the threshold, a
    # dark seam between two plates is path enough, and the cut-out came back
    # with the room showing through the animal's chest for the whole swipe
    # wind-up. A second, much lower key (max < 6: the studio black itself
    # measures 0-2) says what is truly background; whatever that key keeps and
    # the first threw away is the body's own shadow, and it is put back where it
    # lies INSIDE the animal — within the closing of the bright silhouette, four
    # pixels clear of true black so the soft glow round the outline stays out,
    # and touching the body.
    lo = a.max(axis=2) < 6
    seeds_lo = np.zeros(lo.shape, dtype=bool)
    seeds_lo[0] = lo[0]; seeds_lo[-1] = lo[-1]; seeds_lo[:, 0] = lo[:, 0]; seeds_lo[:, -1] = lo[:, -1]
    solid_lo = ndimage.binary_fill_holes(~ndimage.binary_propagation(seeds_lo, mask=lo))
    inner = ndimage.binary_erosion(solid_lo, iterations=4)
    pad = 64
    hull = ndimage.binary_closing(np.pad(subject, pad), iterations=56)[pad:-pad, pad:-pad]
    # ...and INSIDE means plating ALL ROUND it. The first cut of this rule had
    # only the closing, and on the takes filmed over a faintly lit floor it
    # hung a dark curtain under the belly — floor shadow between the legs is
    # dark-but-not-black too. So a dark pixel is the body's only if a ray from
    # it meets plating within 72 px in at least 15 of 16 directions: a shoulder
    # socket is walled in, the space under the belly is open to the floor.
    add = inner & hull & ~subject
    if add.any():
        L, pad2 = 72, 76
        ys2, xs2 = np.where(subject)
        y0, y1, x0, x1 = max(0, ys2.min() - 2), ys2.max() + 3, max(0, xs2.min() - 2), xs2.max() + 3
        sub = np.pad(subject[y0:y1, x0:x1], pad2)
        hits = np.zeros(sub.shape, dtype=np.uint8)
        for d in range(16):
            ang = d * np.pi / 8; dx, dy = np.cos(ang), np.sin(ang)
            seen = np.zeros(sub.shape, dtype=bool)
            for r in range(2, L + 1, 2):
                seen |= np.roll(sub, (int(round(dy * r)), int(round(dx * r))), axis=(0, 1))
            hits += seen
        walled = np.zeros(subject.shape, dtype=bool)
        walled[y0:y1, x0:x1] = hits[pad2:-pad2, pad2:-pad2] >= 15
        add &= walled
    add = ndimage.binary_propagation(ndimage.binary_dilation(subject, iterations=2) & add, mask=add)
    subject = ndimage.binary_fill_holes(subject | add)
    alpha = subject.astype(np.uint8) * 255
    ys, xs = np.where(subject)
    if not len(xs):
        raise ValueError('empty frame')
    # Reject sparse dust rows when locating the soles, without cutting toes.
    sole = subject[:, subject.shape[1] // 2:] if args.foot_right else subject
    rows = np.flatnonzero(sole.sum(axis=1) >= 10)
    foot = int(rows[-1])
    alpha[foot + 1:] = 0
    return Image.fromarray(np.dstack((a, alpha))), (int(xs.min()), int(ys.min()), int(xs.max()) + 1, foot + 1)

rest, rb = frame(args.rest)
if args.make_grade:
    grade_times = np.linspace(args.start + .02, args.end - .02, args.frames)
    ref = dict(source=args.source, frames=args.frames, span=[args.start, args.end], **look_many([frame(float(t))[0] for t in grade_times]))
    Path(args.make_grade).write_text(json.dumps(ref, indent=2) + '\n')
    print(json.dumps(ref)); raise SystemExit
scale = min(210 / (rb[3] - rb[1]), 320 / (rb[2] - rb[0]))
times = np.array([float(t) for t in args.times.split(',')]) if args.times \
    else np.linspace(args.start + .02, args.end - .02, args.frames)
args.frames = len(times)
sampled = [frame(float(t)) for t in times]
graded = None
if args.grade:
    # STEADY FIRST. A take's exposure wanders while it plays — the swipe opens
    # at 126, sinks to 112 through the wind-up and comes back at 126 — and one
    # curve for the whole take leaves that wander in. Each frame's plating
    # median is pulled to the take's own, through a 5-frame median so a single
    # contact flash cannot drag its neighbours, and capped so a pose that is
    # honestly darker (a crouch in its own shadow) is not flattened.
    def plating(im):
        a = np.asarray(im).astype(np.float64); rgb = a[:, :, :3]
        px = rgb[(a[:, :, 3] > 200) & (rgb.max(axis=2) - rgb.min(axis=2) < 44)]
        return float(np.median(px @ np.array([.2126, .7152, .0722]))) if len(px) else 0.0
    med = np.array([plating(im) for im, _ in sampled])
    pad = np.pad(med, 2, mode='edge')
    smooth = np.array([np.median(pad[i:i + 5]) for i in range(len(med))])
    steady = np.clip(np.median(smooth) / np.maximum(1.0, smooth), .84, 1.19)
    def gain(im, g):
        a = np.asarray(im).astype(np.float64); a[:, :, :3] = np.clip(a[:, :, :3] * g, 0, 255)
        return Image.fromarray(a.round().astype(np.uint8), 'RGBA')
    sampled = [(gain(im, g), b) for (im, b), g in zip(sampled, steady)]
    ref, own = json.loads(Path(args.grade).read_text()), look_many([im for im, _ in sampled])
    lut = curve_lut(own, ref)
    regrade = lambda im: regrade_with(lut, im)
    sampled = [(regrade(im), b) for im, b in sampled]
# A take that starts and ends on the same standing pose (mirrored, for a turn)
# must end on the spot it started, or the animal steps sideways at the cut.
drift = ((sampled[-1][1][0] + sampled[-1][1][2]) - (sampled[0][1][0] + sampled[0][1][2])) / 2 if args.drift else 0
shift = [drift * i / max(1, len(sampled) - 1) for i in range(len(sampled))]
if args.grade:
    graded = dict(reference=args.grade, takeMean=own['mean'], after=look_many([im for im, _ in sampled])['mean'], target=ref['mean'],
                  steady=[round(float(g), 3) for g in steady])
center = (min(b[0] - d for (_, b), d in zip(sampled, shift)) + max(b[2] - d for (_, b), d in zip(sampled, shift))) / 2
cw, ch = 448, 256
anchor = ((rb[0] + rb[2]) / 2 - center) * scale
feet = []
for (im, b), d in zip(sampled, shift):
    al = np.asarray(im)[:, :, 3]
    cols = np.flatnonzero((al[max(b[1], b[3] - round(14 / scale)):b[3]] > 32).sum(axis=0) >= 2)
    feet.append([round(float((cols[0] - d - center) * scale), 1), round(float((cols[-1] + 1 - d - center) * scale), 1)] if len(cols) else None)
sheet = Image.new('RGBA', (cw * args.frames, ch))
coverage = [np.count_nonzero(np.array(im)[:, :, 3] > 32) for im, _ in sampled]
if min(coverage) < max(coverage) * args.min_coverage:
    raise ValueError('body vanished during keying; inspect the complete sequence')
for i, (im, b) in enumerate(sampled):
    x = round(cw / 2 + (b[0] - shift[i] - center) * scale)
    crop = im.crop(b)
    w, h = round(crop.width * scale), round(crop.height * scale)
    if x < 4 or x + w > cw - 4 or h > ch - 4:
        raise ValueError(f'frame {i} clips: {x},{w},{h}; do not shrink poses independently')
    sheet.alpha_composite(crop.resize((w, h), Image.Resampling.LANCZOS), (i * cw + x, ch - h))
out = Path(args.output); out.parent.mkdir(parents=True, exist_ok=True)
sheet.save(out, quality=90, method=6)
metadata = dict(source=args.source, frames=args.frames, cell=[cw, ch],
    times=[round(float(t), 4) for t in times], scale=scale,
    threshold=args.threshold, strictBorders=args.strict_borders, footRight=args.foot_right,
    rootMotion='vertical removed; simulation supplies trajectory',
    reference='standing envelope: 320x210px', rest=args.rest,
    anchor=round(float(anchor), 2), drift=round(float(drift * scale), 2), feet=feet, grade=graded, reviewed=False)
out.with_suffix('.motion.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(json.dumps(dict(output=str(out), bytes=out.stat().st_size, **metadata)))
