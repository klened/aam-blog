# -*- coding: utf-8 -*-
"""사내근로복지기금 설립 글의 대표 그림. 네 단계와 기간을 한 줄로 보여 준다."""
import sys
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')

W, H, S = 1200, 630, 2
남색 = (31, 56, 100)
금색 = (196, 165, 105)
배경 = (254, 254, 254)
연회색 = (244, 246, 250)
중회색 = (148, 161, 182)
글자 = (26, 29, 37)
흐린글자 = (98, 107, 120)

굵게 = 'C:/Windows/Fonts/malgunbd.ttf'
보통 = 'C:/Windows/Fonts/malgun.ttf'
F = {}


def f(굵음, 크기):
    key = (굵음, 크기)
    if key not in F:
        F[key] = ImageFont.truetype(굵게 if 굵음 else 보통, 크기 * S)
    return F[key]


im = Image.new('RGB', (W * S, H * S), 배경)
d = ImageDraw.Draw(im)


def 글(x, y, t, 크기=17, 굵음=False, 색=글자, 맞춤='la'):
    d.text((x * S, y * S), t, font=f(굵음, 크기), fill=색, anchor=맞춤)


def 상자(x1, y1, x2, y2, 반지름=10, 채움=None, 선=None, 두께=1):
    d.rounded_rectangle(
        (x1 * S, y1 * S, x2 * S, y2 * S), radius=반지름 * S,
        fill=채움, outline=선, width=두께 * S,
    )


# ── 머리 ───────────────────────────────────────────────
d.rectangle((0, 0, W * S, 100 * S), fill=남색)
글(60, 50, '설립, 인가까지 얼마나 걸리나', 34, True, (255, 255, 255), 'lm')
글(1140, 50, '근로복지기본법 제52조 · 제55조', 16, False, (196, 207, 226), 'rm')

# ── 네 단계 ────────────────────────────────────────────
단계 = [
    ('1', '준비위원회 구성', '근로자 위원은\n근로자가 뽑습니다', '회사 사정', False),
    ('2', '정관 작성', '목적사업을\n여기서 정합니다', '회사 사정', False),
    ('3', '설립인가', '지방고용노동관서\n수수료 없음', '20일', True),
    ('4', '설립등기', '등기해야\n법인이 생깁니다', '3주 이내', True),
]

칸너비 = 246
사이 = 34
시작 = 60
위 = 156
높이 = 244

for i, (번호, 이름, 설명, 기간, 강조) in enumerate(단계):
    x = 시작 + i * (칸너비 + 사이)
    상자(x, 위, x + 칸너비, 위 + 높이, 12, 연회색 if not 강조 else (240, 244, 251),
         (219, 227, 240) if 강조 else None, 1)

    # 번호 동그라미
    cx, cy, r = x + 30, 위 + 34, 15
    d.ellipse(((cx - r) * S, (cy - r) * S, (cx + r) * S, (cy + r) * S),
              fill=남색 if 강조 else 중회색)
    글(cx, cy, 번호, 16, True, (255, 255, 255), 'mm')

    글(x + 22, 위 + 78, 이름, 20, True, 남색)
    for j, 줄 in enumerate(설명.split('\n')):
        글(x + 22, 위 + 116 + j * 26, 줄, 15, False, 흐린글자)

    # 기간 띠
    띠위 = 위 + 높이 - 62
    상자(x + 22, 띠위, x + 칸너비 - 22, 띠위 + 42, 8, 남색 if 강조 else (232, 236, 243))
    글(x + 칸너비 / 2, 띠위 + 21, 기간, 19 if 강조 else 16, True,
       금색 if 강조 else 흐린글자, 'mm')

    # 화살표
    if i < 3:
        ax = x + 칸너비 + 8
        ay = 위 + 높이 / 2
        d.polygon((
            ((ax + 16) * S, ay * S),
            (ax * S, (ay - 9) * S),
            (ax * S, (ay + 9) * S),
        ), fill=중회색)

# ── 아래 ───────────────────────────────────────────────
글(60, 452, '법이 기간을 정한 것은 3단계와 4단계뿐입니다', 18, True, 금색)
글(60, 492, '1·2단계는 회사 사정에 따라 달라지고, 여기서 대부분의 시간이 들어갑니다.', 17, False, 글자)
글(60, 524, '특히 정관의 목적사업을 무엇으로 적느냐에 따라 나중에 쓸 수 있는 항목과 세금이 갈립니다.', 17, False, 글자)

글(1140, 600, '노무법인 도원', 17, True, 남색, 'rm')

밖 = 'C:/Users/owner/Desktop/★업무/dowon-blog/content/posts/기금-설립-얼마나-걸리나/1.webp'
im.resize((W, H), Image.LANCZOS).save(밖, 'WEBP', quality=92, method=6)
print('만들었습니다:', 밖)
