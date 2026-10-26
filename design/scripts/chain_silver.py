"""Builds public/assets/chain-silver.webp (the chains down the sides of every page) from the drawing
public/assets/broken chain.png.

Fills the inside of the drawn outline with shaded gunmetal (chrome banding, darker edges, a highlight
just inside them, bright glints), leaves the centre of each whole link open, colours the shards around
the break the same metal with a thin dark rim, then stands the chain upright at 1800px tall.

Needs Pillow, numpy and scipy:  python3 design/scripts/chain_silver.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/assets/broken chain.png"
OUT = ROOT / "public/assets/chain-silver.webp"

# Gunmetal ramp, outline colour and glint colour.
DARK, LIGHT = np.array([34, 37, 42.0]), np.array([150, 155, 163.0])
OUTLINE = np.array([14, 15, 17.0])
GLINT = np.array([236, 240, 245.0])

# Centres of the six whole links' open middles (x, y in the drawing), found by labelling its regions.
LINK_CENTRES = [(192, 1097), (532, 1112), (829, 1105), (1616, 1036), (1901, 1037), (2240, 1012)]


def grow(mask, size):
    return np.array(Image.fromarray((mask * 255).astype("uint8")).filter(ImageFilter.MaxFilter(size))) > 0


def distance_inside(mask, steps=14):
    """Pixels' distance from the edge of `mask`, capped at `steps`."""
    d = np.zeros(mask.shape)
    m = Image.fromarray((mask * 255).astype("uint8"))
    for _ in range(steps):
        m = m.filter(ImageFilter.MinFilter(3))
        d += np.array(m) > 0
    return d


gray = np.array(Image.open(SRC).convert("L")).astype(float)
ink = gray < 140

# Inside of the outline: everything the outside can't reach. Small gaps in the hand-drawn line are
# closed first so the outside fill can't leak in.
P = 8
pad = Image.new("L", (ink.shape[1] + 2 * P, ink.shape[0] + 2 * P), 0)
pad.paste(Image.fromarray((grow(ink, 7) * 255).astype("uint8")), (P, P))
ImageDraw.floodfill(pad, (0, 0), 128)
outside = grow(np.array(pad)[P:-P, P:-P] == 128, 7)
body = ~outside & ~ink

# Open the middle of each whole link.
regions, _ = ndimage.label(body)
for x, y in LINK_CENTRES:
    body &= regions != regions[y, x]

# Shards around the break: solid ink blobs that don't touch the chain. Shade their inside like the
# chain and keep a 2px dark rim.
blobs, n = ndimage.label(ink)
touching = set(np.unique(blobs[grow(body, 9)]))
shards = np.isin(blobs, [i for i in range(1, n + 1) if i not in touching])
shard_fill = np.array(Image.fromarray((shards * 255).astype("uint8")).filter(ImageFilter.MinFilter(5))) > 0
metal = body | shard_fill

# Shading.
d = distance_inside(metal)
bevel = np.interp(d, [0, 2, 6, 9, 14], [0.30, 0.62, 1.0, 0.86, 0.78])
yy, xx = np.mgrid[0 : metal.shape[0], 0 : metal.shape[1]]
band = 0.5 + 0.5 * np.sin(2 * np.pi * (xx * 0.35 + yy) / 150)
t = np.clip(bevel * (0.72 + 0.28 * band), 0, 1)
rgb = DARK + (LIGHT - DARK) * t[..., None]
spec = np.clip(np.exp(-(((d - 5.5) / 1.8) ** 2)) * np.clip((band - 0.6) / 0.4, 0, 1) ** 1.5 * 1.15, 0, 1) * metal
rgb = rgb * (1 - spec[..., None]) + GLINT * spec[..., None]

# Outlines on top (anti-aliased), transparent everywhere else.
line = np.clip((200 - gray) / 120, 0, 1) * ~shard_fill
out = np.zeros((*metal.shape, 4))
out[..., :3] = rgb * (1 - line[..., None]) + OUTLINE * line[..., None]
out[..., 3] = np.maximum(metal * 1.0, line) * 255

img = Image.fromarray(out.astype("uint8"))
left, top, right, bottom = img.getbbox()
img = img.crop((left - 4, top - 4, right + 4, bottom + 4)).rotate(90, expand=True)
img = img.resize((round(img.width * 1800 / img.height), 1800), Image.LANCZOS)
img.save(OUT, quality=88, method=6)
print(f"wrote {OUT.relative_to(ROOT)} {img.size}, {n - len(touching) + 1} shards")
