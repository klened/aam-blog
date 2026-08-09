# -*- coding: utf-8 -*-
"""임금체불 시즌 5편 대표이미지"""
import sys, os
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding="utf-8")

S = 2
W, H = 1200 * S, 630 * S
OUT = r"C:\Users\owner\Desktop\★업무\dowon-blog\content\posts"

NAVY = (31, 56, 100)
WHITE = (254, 254, 254)
CARD_A = (244, 246, 250)
CARD_B = (250, 246, 245)
BAND_GOLD = (130, 103, 48)
BAND_RED = (176, 66, 67)
BAND_NAVY = (31, 56, 100)
TXT_GOLD = (140, 105, 40)
TXT_RED = (172, 44, 48)
TXT_DARK = (30, 38, 52)
TXT_MUTE = (96, 104, 120)
HEAD_SUB = (172, 188, 214)
LINE = (222, 227, 236)

BD = r"C:\Windows\Fonts\malgunbd.ttf"
RG = r"C:\Windows\Fonts\malgun.ttf"


def f(p, s):
    return ImageFont.truetype(p, s * S)


def w(d, t, font):
    return d.textlength(t, font=font)


def wrap(d, text, font, maxw):
    out, line = [], ""
    for ch in text:
        if w(d, line + ch, font) > maxw and line:
            out.append(line); line = ch
        else:
            line += ch
    if line:
        out.append(line)
    return out


def base(title, source):
    im = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 100 * S], fill=NAVY)
    size = 34
    while w(d, title, f(BD, size)) > 930 * S and size > 24:
        size -= 1
    d.text((60 * S, 50 * S), title, font=f(BD, size), fill=(255, 255, 255), anchor="lm")
    d.text((1140 * S, 52 * S), source, font=f(RG, 15), fill=HEAD_SUB, anchor="rm")
    return im, d


def footer(d, lead, sentence):
    d.text((60 * S, 464 * S), lead, font=f(BD, 18), fill=TXT_GOLD, anchor="lm")
    d.text((60 * S, 504 * S), sentence, font=f(RG, 17), fill=TXT_DARK, anchor="lm")
    d.text((1140 * S, 600 * S), "노무법인 도원", font=f(BD, 16), fill=NAVY, anchor="rm")


def cards(im, d, items):
    n = len(items)
    gap = 30 if n <= 3 else 22
    cw = (1080 - gap * (n - 1)) / n
    top, bot = 148, 415
    pad = 26 if n <= 3 else 20
    t_size = 24 if n <= 2 else (21 if n == 3 else 19)
    s_size = 15 if n <= 3 else 13
    i_size = 16 if n <= 2 else (15 if n == 3 else 13)
    for k, c in enumerate(items):
        x = 60 + k * (cw + gap)
        d.rounded_rectangle([x * S, top * S, (x + cw) * S, bot * S], radius=12 * S,
                            fill=CARD_A if k % 2 == 0 else CARD_B)
        tx, maxw = (x + pad) * S, (cw - pad * 2) * S
        d.text((tx, (top + 44) * S), c["제목"], font=f(BD, t_size), fill=c["색"], anchor="lm")
        y = top + 76
        for ln in wrap(d, c.get("부제", ""), f(RG, s_size), maxw):
            d.text((tx, y * S), ln, font=f(RG, s_size), fill=TXT_MUTE, anchor="lm")
            y += s_size + 7
        y += 12
        for it in c.get("항목", []):
            for j, ln in enumerate(wrap(d, it, f(RG, i_size), maxw - 12 * S)):
                d.text((tx, y * S), ("· " if j == 0 else "  ") + ln,
                       font=f(RG, i_size), fill=TXT_DARK, anchor="lm")
                y += i_size + 9
        if c.get("밴드"):
            bh, by = 36, bot - 56
            d.rounded_rectangle([tx, by * S, (x + cw - pad) * S, (by + bh) * S],
                                radius=7 * S, fill=c.get("밴드색", BAND_GOLD))
            d.text(((x + cw / 2) * S, (by + bh / 2) * S), c["밴드"],
                   font=f(BD, 15 if n <= 2 else (13 if n == 3 else 12)),
                   fill=(255, 255, 255), anchor="mm")


def table(d, 머리, 줄들, 강조=-1, 폭=None, top=150):
    n = len(머리)
    left, right, rh = 60, 1140, 44
    폭 = 폭 or [1 / n] * n
    xs, acc = [], left
    for p in 폭:
        xs.append(acc); acc += (right - left) * p
    xs.append(right)
    d.rounded_rectangle([left * S, top * S, right * S, (top + rh) * S], radius=8 * S, fill=NAVY)
    for i, t in enumerate(머리):
        d.text(((((xs[i] + xs[i + 1]) / 2)) * S, (top + rh / 2) * S), t,
               font=f(BD, 16), fill=(255, 255, 255), anchor="mm")
    y = top + rh
    for r, row in enumerate(줄들):
        bg = (250, 246, 240) if r == 강조 else (WHITE if r % 2 == 0 else (248, 250, 253))
        d.rectangle([left * S, y * S, right * S, (y + rh) * S], fill=bg)
        d.line([left * S, (y + rh) * S, right * S, (y + rh) * S], fill=LINE, width=1)
        for i, t in enumerate(row):
            d.text(((((xs[i] + xs[i + 1]) / 2)) * S, (y + rh / 2) * S), t,
                   font=f(BD if r == 강조 or i == 0 else RG, 16),
                   fill=(TXT_RED if r == 강조 else TXT_DARK), anchor="mm")
        y += rh
    return y


def steps(im, d, items):
    gap = 26
    cw = (1080 - gap * 2) / 3
    ch = 130
    for k, (no, name, note) in enumerate(items):
        r, c = divmod(k, 3)
        x = 60 + c * (cw + gap)
        y = 150 + r * (ch + 24)
        d.rounded_rectangle([x * S, y * S, (x + cw) * S, (y + ch) * S],
                            radius=11 * S, fill=CARD_A if r == 0 else CARD_B)
        d.ellipse([(x + 22) * S, (y + 20) * S, (x + 50) * S, (y + 48) * S], fill=NAVY)
        d.text(((x + 36) * S, (y + 34) * S), no, font=f(BD, 15),
               fill=(255, 255, 255), anchor="mm")
        d.text(((x + 60) * S, (y + 34) * S), name, font=f(BD, 19), fill=TXT_DARK, anchor="lm")
        yy = y + 68
        for ln in wrap(d, note, f(RG, 14), (cw - 44) * S):
            d.text(((x + 22) * S, yy * S), ln, font=f(RG, 14), fill=TXT_MUTE, anchor="lm")
            yy += 21


def save(im, slug):
    p = os.path.join(OUT, slug)
    os.makedirs(p, exist_ok=True)
    dest = os.path.join(p, "1.webp")
    im.resize((1200, 630), Image.LANCZOS).save(dest, "WEBP", quality=88, method=6)
    print(f"  {slug}/1.webp  {os.path.getsize(dest)//1024}KB")


