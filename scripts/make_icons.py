from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
out = root / 'public' / 'icons'
out.mkdir(parents=True, exist_ok=True)

def icon(size: int, maskable: bool = False) -> Image.Image:
    img = Image.new('RGBA', (size, size), '#160c08')
    d = ImageDraw.Draw(img)
    pad = int(size * (0.06 if maskable else 0.02))
    d.rounded_rectangle([pad, pad, size-pad, size-pad], radius=int(size*0.22), fill='#2b160c', outline='#b87333', width=max(4, size//48))
    # furnace glow
    d.ellipse([int(size*.14), int(size*.15), int(size*.86), int(size*.9)], fill='#44200f')
    d.ellipse([int(size*.24), int(size*.25), int(size*.76), int(size*.82)], fill='#7e3817')
    d.ellipse([int(size*.32), int(size*.34), int(size*.68), int(size*.72)], fill='#e06b2a')
    d.ellipse([int(size*.40), int(size*.42), int(size*.60), int(size*.65)], fill='#f3c55f')
    # glass globe
    d.ellipse([int(size*.26), int(size*.18), int(size*.74), int(size*.66)], fill='#2c5f8e', outline='#fff1d7', width=max(3, size//80))
    d.ellipse([int(size*.34), int(size*.25), int(size*.48), int(size*.39)], fill=(255,255,255,145))
    # rack
    y = int(size*.73)
    d.rounded_rectangle([int(size*.18), y, int(size*.82), y+int(size*.06)], radius=int(size*.03), fill='#3b3128')
    for x in range(int(size*.22), int(size*.8), int(size*.12)):
        d.line([x, y, x+int(size*.05), y+int(size*.06)], fill='#b87333', width=max(2, size//90))
    return img

for s in (192, 512):
    icon(s).save(out / f'icon-{s}.png')
icon(512, True).save(out / 'icon-512-maskable.png')
icon(180).save(out / 'apple-touch-icon.png')
print(out)
