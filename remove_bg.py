from PIL import Image

SRC = 'client/public/seat-skip'
FILES = ['choose-spot', 'middle-seat', 'sit-together']

# The original jpeg is a rounded dark-blue card with a thin white border in the
# corners. Crop a few px off every side so object-cover hides the white edge,
# then re-save as jpeg (keep its own blue gradient background).
PAD = 10

for n in FILES:
    im = Image.open(f'{SRC}/{n}.jpeg').convert('RGB')
    w, h = im.size
    im2 = im.crop((PAD, PAD, w - PAD, h - PAD))
    im2.save(f'{SRC}/{n}.jpeg', quality=92)
    print(n, '->', im2.size)
