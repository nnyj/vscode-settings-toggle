from PIL import Image, ImageDraw
import math

scale = 4
size = 256 * scale
img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

cx, cy = size // 2, size // 2

draw.rounded_rectangle([8*scale, 8*scale, size-8*scale, size-8*scale], radius=40*scale, fill=(50, 50, 50))

outer_r = 80 * scale
inner_r = 55 * scale
hole_r = 30 * scale
teeth = 8
tooth_w = math.pi / teeth * 0.6

points = []
for i in range(teeth):
  a = 2 * math.pi * i / teeth
  for da in [-tooth_w/2, tooth_w/2]:
    angle = a + da
    points.append((cx + outer_r * math.cos(angle), cy + outer_r * math.sin(angle)))
  a_next = 2 * math.pi * (i + 0.5) / teeth
  for da in [-tooth_w/2, tooth_w/2]:
    angle = a_next + da
    points.append((cx + inner_r * math.cos(angle), cy + inner_r * math.sin(angle)))

draw.polygon(points, fill=(200, 200, 200))
draw.ellipse([cx-hole_r, cy-hole_r, cx+hole_r, cy+hole_r], fill=(50, 50, 50))

arrow_r = 22 * scale
for start_angle in [0, 180]:
  draw.arc([cx-arrow_r, cy-arrow_r, cx+arrow_r, cy+arrow_r],
           start_angle, start_angle + 120, fill=(120, 200, 255), width=4*scale)
  end_a = math.radians(start_angle + 120)
  ax = cx + arrow_r * math.cos(end_a)
  ay = cy + arrow_r * math.sin(end_a)
  ha1 = end_a + math.radians(140)
  ha2 = end_a + math.radians(220)
  draw.polygon([
    (ax, ay),
    (ax + 10*scale*math.cos(ha1), ay + 10*scale*math.sin(ha1)),
    (ax + 10*scale*math.cos(ha2), ay + 10*scale*math.sin(ha2))
  ], fill=(120, 200, 255))

img = img.resize((256, 256), Image.LANCZOS)
img.save('icon.png')
