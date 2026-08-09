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


# 1. 임금체불-형사처벌
im, d = base("처벌 규정은 있는데, 반의사불벌입니다", "근로기준법 제36조 · 제109조")
cards(im, d, [
    {"제목": "처벌 규정", "색": TXT_RED, "부제": "과태료가 아니라 벌금입니다",
     "항목": ["3년 이하 징역 또는 3천만원 이하 벌금", "퇴직 후 14일 이내 금품 청산",
              "수사를 받고 전과가 남습니다"],
     "밴드": "근로기준법 제109조 제1항", "밴드색": BAND_RED},
    {"제목": "반의사불벌", "색": TXT_GOLD, "부제": "근로자의 의사가 기소를 가릅니다",
     "항목": ["처벌을 원하지 않으면 공소 제기 불가", "사업주가 돈을 줄 유인이 생깁니다",
              "근로자가 가진 지렛대는 이것 하나"],
     "밴드": "돈을 받은 뒤에 밝히십시오", "밴드색": BAND_GOLD},
])
footer(d, "순서를 거꾸로 하면 되돌릴 수 없습니다",
       "취하하고 나면 돈이 안 들어와도 형사 절차는 이미 끝나 있습니다.")
save(im, "임금체불-형사처벌")

# 2. 임금체불-진정서-쓰는법
im, d = base("진정서에서 결과를 가르는 것", "근로기준법 제36조")
y = table(d, ["월", "받아야 할 금액", "받은 금액", "못 받은 금액"],
          [["3월", "280만원", "280만원", "0원"],
           ["4월", "280만원", "150만원", "130만원"],
           ["5월", "280만원", "0원", "280만원"]],
          강조=2, 폭=[0.16, 0.28, 0.28, 0.28])
d.text((60 * S, (y + 42) * S), "이 표 하나가 조사의 출발점이 됩니다",
       font=f(BD, 20), fill=TXT_GOLD, anchor="lm")
d.text((60 * S, (y + 80) * S), "「6개월치 못 받았다」로 내면 회사가 자료를 낼 때까지 기다리게 됩니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "가장 강한 자료는 통장 입금 내역입니다",
       "자료가 하나도 없다고 포기하지 마십시오. 끊긴 기록이 그 자체로 자료입니다.")
save(im, "임금체불-진정서-쓰는법")

# 3. 연차수당-정산-기준
im, d = base("회계연도 기준은 되는데, 퇴직할 때 다시 셉니다", "근로기준법 제60조 · 제61조")
y = table(d, ["", "입사일 기준", "회계연도 기준"],
          [["발생 시점", "사람마다 다릅니다", "모두 같습니다"],
           ["관리", "어렵습니다", "편합니다"],
           ["퇴직할 때", "그대로 정산", "다시 계산해야 합니다"]],
          강조=2, 폭=[0.24, 0.38, 0.38])
d.text((60 * S, (y + 42) * S), "적게 준 만큼이 그대로 임금체불이 됩니다",
       font=f(BD, 20), fill=TXT_GOLD, anchor="lm")
d.text((60 * S, (y + 80) * S), "한 사람이 문제 삼으면 같은 방식으로 계산한 다른 퇴사자도 함께 드러납니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "사용촉진은 서면이어야 하고 기한이 있습니다",
       "1차는 1년이 되기 6개월 전 기준 10일 이내, 2차는 끝나기 2개월 전까지입니다.")
save(im, "연차수당-정산-기준")

# 4. 건설-임금체불-연대책임
im, d = base("원청이 언제 임금을 물어야 하나", "근로기준법 제44조 · 제44조의2")
cards(im, d, [
    {"제목": "제44조", "색": TXT_GOLD, "부제": "도급사업 일반에 적용됩니다",
     "항목": ["직상 수급인의 귀책사유가 필요합니다", "잘못이 없었다면 다툴 여지가 있습니다"],
     "밴드": "귀책사유를 따집니다", "밴드색": BAND_GOLD},
    {"제목": "제44조의2", "색": TXT_RED, "부제": "건설업에서 2차 이상 도급이 이루어진 경우",
     "항목": ["하수급인이 건설사업자가 아닐 것", "귀책사유를 따지지 않습니다",
              "대금을 다 줬어도 책임이 남습니다"],
     "밴드": "귀책사유를 따지지 않습니다", "밴드색": BAND_RED},
])
footer(d, "우리 현장이 어느 쪽인지부터 확인하십시오",
       "도급 단계와 하수급인의 자격 두 가지로 갈리고, 방어 방법이 완전히 달라집니다.")
save(im, "건설-임금체불-연대책임")

# 5. 최저임금-위반-판단
im, d = base("총액은 넘는데 미달하는 경우", "2026년 최저임금 시간급 10,320원")
y = table(d, ["", "금액", "판단"],
          [["월급 총액", "2,300,000원", "넘습니다"],
           ["연장근로 가산수당", "빼기 300,000원", "산입되지 않습니다"],
           ["산입되는 임금", "2,000,000원", ""],
           ["최저임금 월 환산액", "2,156,880원", "156,880원 미달"]],
          강조=3, 폭=[0.36, 0.32, 0.32])
d.text((60 * S, (y + 40) * S), "연장·야간·휴일 가산수당과 연차 미사용수당은 빼고 계산합니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "동의를 받아도 무효입니다",
       "미달한 부분은 최저임금액으로 채워지고, 그 차액이 소급해서 임금체불이 됩니다.")
save(im, "최저임금-위반-판단")

print("\n끝")
