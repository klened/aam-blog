# -*- coding: utf-8 -*-
"""구성원 사진 두 장을 만든다. 본문용(높이 520)과 얼굴용(160 원형)."""
import sys
from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding='utf-8')

이름 = '김태형'
원본 = Image.open('김태형원본.png').convert('RGBA')
밖 = 'C:/Users/owner/Desktop/★업무/dowon-blog/public/images/노무사/'

# ── 본문용: 투명 여백을 잘라내고 높이를 520 으로 맞춘다 ──────────
잘린 = 원본.crop(원본.split()[-1].getbbox())
높이 = 520
너비 = round(잘린.width * 높이 / 잘린.height)
본문 = 잘린.resize((너비, 높이), Image.LANCZOS)
본문.save(밖 + f'{이름}.webp', 'WEBP', quality=92, method=6)
print(f'  본문  {본문.size}')

# ── 얼굴용: 머리를 중심으로 정사각형을 떠서 원형으로 자른다 ──────
# 머리 위치는 원본 좌표로 잡는다. 자른 이미지가 아니라 원본 기준이다.
중심x, 중심y, 한변 = 488, 560, 590
얼굴 = 원본.crop((중심x - 한변 // 2, 중심y - 한변 // 2, 중심x + 한변 // 2, 중심y + 한변 // 2))
얼굴 = 얼굴.resize((160, 160), Image.LANCZOS)

# 원형 마스크. 기존 사진들과 같은 모양이라 화면에서 따로 손볼 것이 없다.
마스크 = Image.new('L', (640, 640), 0)
ImageDraw.Draw(마스크).ellipse((0, 0, 639, 639), fill=255)
마스크 = 마스크.resize((160, 160), Image.LANCZOS)

원형 = Image.new('RGBA', (160, 160), (0, 0, 0, 0))
원형.paste(얼굴, (0, 0), 마스크)
원형.save(밖 + f'얼굴/{이름}.webp', 'WEBP', quality=92, method=6)
print(f'  얼굴  {원형.size}')

# 확인용으로 크게 한 장 남긴다
원형.resize((320, 320), Image.LANCZOS).convert('RGB').save('얼굴확인.png')
