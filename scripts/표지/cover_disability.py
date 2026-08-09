# -*- coding: utf-8 -*-
"""장애인 고용부담금 9편 대표이미지"""
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


def f(path, size):
    return ImageFont.truetype(path, size * S)


def w(d, t, font):
    return d.textlength(t, font=font)


def wrap(d, text, font, maxw):
    out, line = [], ""
    for ch in text:
        if w(d, line + ch, font) > maxw and line:
            out.append(line)
            line = ch
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
    while w(d, title, f(BD, size)) > 940 * S and size > 24:
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
    total = 1080 - gap * (n - 1)
    cw = total / n
    top, bot = 148, 415
    pad = 26 if n <= 3 else 20
    t_size = 24 if n <= 2 else (21 if n == 3 else 19)
    s_size = 15 if n <= 3 else 13
    i_size = 16 if n <= 2 else (15 if n == 3 else 13)

    for k, c in enumerate(items):
        x = 60 + k * (cw + gap)
        d.rounded_rectangle(
            [x * S, top * S, (x + cw) * S, bot * S],
            radius=12 * S,
            fill=CARD_A if k % 2 == 0 else CARD_B,
        )
        tx = (x + pad) * S
        maxw = (cw - pad * 2) * S

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
            bf = f(BD, 15 if n <= 2 else (13 if n == 3 else 12))
            d.text(((x + cw / 2) * S, (by + bh / 2) * S), c["밴드"],
                   font=bf, fill=(255, 255, 255), anchor="mm")


def table(im, d,머리, 줄들, 강조=-1, 폭=None):
    """가운데 큰 표. 돈 계산형 글의 킬러 포인트."""
    n = len(머리)
    left, right = 60, 1140
    폭 = 폭 or [1 / n] * n
    xs, acc = [], left
    for p in 폭:
        xs.append(acc)
        acc += (right - left) * p
    xs.append(right)

    top = 150
    rh = 44
    d.rounded_rectangle([left * S, top * S, right * S, (top + rh) * S],
                        radius=8 * S, fill=NAVY)
    for i, t in enumerate(머리):
        cx = (xs[i] + xs[i + 1]) / 2
        d.text((cx * S, (top + rh / 2) * S), t, font=f(BD, 16),
               fill=(255, 255, 255), anchor="mm")

    y = top + rh
    for r, row in enumerate(줄들):
        bg = (250, 246, 240) if r == 강조 else (WHITE if r % 2 == 0 else (248, 250, 253))
        d.rectangle([left * S, y * S, right * S, (y + rh) * S], fill=bg)
        d.line([left * S, (y + rh) * S, right * S, (y + rh) * S], fill=LINE, width=1)
        for i, t in enumerate(row):
            cx = (xs[i] + xs[i + 1]) / 2
            강 = (r == 강조)
            d.text((cx * S, (y + rh / 2) * S), t,
                   font=f(BD if 강 or i == 0 else RG, 16),
                   fill=(TXT_RED if 강 else TXT_DARK), anchor="mm")
        y += rh


def steps(im, d, items):
    gap = 26
    cw = (1080 - gap * 2) / 3
    ch = 118
    for k, (no, name, note) in enumerate(items):
        r, c = divmod(k, 3)
        x = 60 + c * (cw + gap)
        y = 150 + r * (ch + 24)
        d.rounded_rectangle([x * S, y * S, (x + cw) * S, (y + ch) * S],
                            radius=11 * S, fill=CARD_A if r == 0 else CARD_B)
        d.ellipse([(x + 22) * S, (y + 20) * S, (x + 50) * S, (y + 48) * S], fill=NAVY)
        d.text(((x + 36) * S, (y + 34) * S), no, font=f(BD, 15),
               fill=(255, 255, 255), anchor="mm")
        d.text(((x + 60) * S, (y + 34) * S), name, font=f(BD, 19),
               fill=TXT_DARK, anchor="lm")
        yy = y + 66
        for ln in wrap(d, note, f(RG, 14), (cw - 44) * S):
            d.text(((x + 22) * S, yy * S), ln, font=f(RG, 14), fill=TXT_MUTE, anchor="lm")
            yy += 21


def save(im, slug):
    p = os.path.join(OUT, slug)
    os.makedirs(p, exist_ok=True)
    dest = os.path.join(p, "1.webp")
    im.resize((1200, 630), Image.LANCZOS).save(dest, "WEBP", quality=88, method=6)
    print(f"  {slug}/1.webp  {os.path.getsize(dest)//1024}KB")


# 1. 장애인-고용부담금-계산 — 다섯 구간 단가표
im, d = base("부담기초액은 다섯 단계로 갈립니다", "2026년도분 · 2027년 1월 신고")
table(im, d,
      ["이행 수준", "가산", "부담기초액"],
      [["의무 인원의 3/4 이상", "없음", "1,295,000원"],
       ["1/2 이상 3/4 미만", "6%", "1,372,700원"],
       ["1/4 이상 1/2 미만", "20%", "1,554,000원"],
       ["1/4 미만", "40%", "1,813,000원"],
       ["한 명도 고용하지 않음", "—", "2,156,880원"]],
      강조=4, 폭=[0.42, 0.20, 0.38])
footer(d, "적게 채울수록 단가까지 올라갑니다",
       "부족 인원과 곱하는 단가가 함께 커져서 금액이 두 배로 벌어집니다.")
save(im, "장애인-고용부담금-계산")

# 2. 장애인-고용부담금-감면-방법 — 네 갈래
im, d = base("부담금을 줄이는 네 가지 길", "장애인고용법 제22조 · 제33조")
cards(im, d, [
    {"제목": "직접 채용", "색": TXT_GOLD, "부제": "맡길 직무를 만들 수 있는 곳",
     "항목": ["구간 경계까지 몇 명인지 먼저", "채용은 마지막에 정합니다"],
     "밴드": "가장 늦게 정할 것", "밴드색": BAND_NAVY},
    {"제목": "중증 인정", "색": TXT_RED, "부제": "이미 고용 중인 분이 있는 곳",
     "항목": ["소정근로 60시간 이상 중증", "한 명을 두 명으로 셉니다"],
     "밴드": "돈이 들지 않습니다", "밴드색": BAND_RED},
    {"제목": "연계고용", "색": TXT_GOLD, "부제": "채용이 어려운 곳",
     "항목": ["직업재활시설·표준사업장에 도급", "신청은 1월 10일까지"],
     "밴드": "사내 직무가 없어도 됩니다", "밴드색": BAND_GOLD},
    {"제목": "자회사형", "색": TXT_GOLD, "부제": "부족 인원이 많은 곳",
     "항목": ["지분 50% 초과 보유", "그 인원이 우리 고용으로"],
     "밴드": "한도가 없습니다", "밴드색": BAND_NAVY},
])
footer(d, "순서를 거꾸로 하면 필요 없는 채용을 합니다",
       "이미 계신 분을 다시 세고 감면을 받은 뒤에야 필요한 인원이 나옵니다.")
save(im, "장애인-고용부담금-감면-방법")

# 3. 장애인-의무고용률 — 규모별 두 기준
im, d = base("고용 의무와 부담금은 기준이 다릅니다", "장애인고용법 제28조 · 제33조")
table(im, d,
      ["상시근로자", "고용 의무", "부담금"],
      [["50명 미만", "없음", "없음"],
       ["50명 이상 100명 미만", "있습니다", "없습니다"],
       ["100명 이상", "있습니다", "있습니다"]],
      강조=2, 폭=[0.44, 0.28, 0.28])
d.text((60 * S, 362 * S), "민간 사업주 의무고용률 3.1% · 소수점 이하는 버립니다",
       font=f(BD, 18), fill=TXT_GOLD, anchor="lm")
d.text((60 * S, 398 * S), "상시 200명이면 6.2명이라 의무 인원은 6명이고, 중증장애인은 한 명을 두 명으로 셉니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "50명대에서 「부담금이 없으니 의무도 없다」가 아닙니다",
       "고용 의무는 이미 있고, 100명을 넘는 순간부터 돈이 나가기 시작합니다.")
save(im, "장애인-의무고용률")

# 4. 장애인-고용부담금이란 — 벌금과 비교
im, d = base("부담금은 벌금이 아닙니다", "장애인고용법 제33조")
cards(im, d, [
    {"제목": "부담금", "색": TXT_GOLD, "부제": "덜 고용한 만큼 내는 공과금",
     "항목": ["스스로 신고하고 납부합니다", "전과가 남지 않습니다",
              "고용 상태가 그대로면 또 나옵니다"],
     "밴드": "매년 반복됩니다", "밴드색": BAND_GOLD},
    {"제목": "벌금", "색": TXT_RED, "부제": "형사처벌",
     "항목": ["수사와 재판을 거칩니다", "전과가 남습니다", "한 번으로 끝납니다"],
     "밴드": "부담금과는 다른 것입니다", "밴드색": BAND_RED},
])
footer(d, "냈다고 고용 의무가 없어지지 않습니다",
       "한 해 금액이 아니라 3년·5년을 합쳐 보셔야 판단이 맞습니다.")
save(im, "장애인-고용부담금이란")

# 5. 장애인-표준사업장 — 두 갈래
im, d = base("표준사업장은 두 갈래로 이어집니다", "장애인고용법 제22조 · 제33조")
cards(im, d, [
    {"제목": "도급을 준다", "색": TXT_GOLD, "부제": "부족 인원이 많지 않은 곳",
     "항목": ["표준사업장에 일을 맡깁니다", "연계고용으로 감면됩니다",
              "한도가 있어 전액은 아닙니다"],
     "밴드": "거래와 서류로 끝납니다", "밴드색": BAND_GOLD},
    {"제목": "자회사로 세운다", "색": TXT_RED, "부제": "부담금이 매년 큰 곳",
     "항목": ["지분 50% 초과 보유", "그 인원이 우리 고용으로 산입",
              "설립 자본과 운영이 듭니다"],
     "밴드": "한도 없이 인원이 줄어듭니다", "밴드색": BAND_NAVY},
])
footer(d, "부족 인원 규모가 방법을 정합니다",
       "한두 명이 부족한데 자회사를 세우면 배보다 배꼽이 큽니다.")
save(im, "장애인-표준사업장")

# 6. 자회사형-표준사업장 — 요건
im, d = base("자회사형 표준사업장 설립 요건", "장애인고용법 제22조")
table(im, d,
      ["무엇을", "기준"],
      [["모회사 지분", "발행주식 총수 또는 출자총액의 50% 초과"],
       ["자회사 규모", "상시근로자 10명 이상"],
       ["장애인 비율", "상시근로자의 30% 이상"],
       ["임금과 시설", "최저임금 이상 지급 · 편의시설 완비"]],
      강조=0, 폭=[0.30, 0.70])
d.text((60 * S, 406 * S), "중증장애인 비율은 규모별로 따로 정해져 있고, 둘 이상이 공동 출자하는 방식도 됩니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "3년치로 놓아야 판단이 나옵니다",
       "한 해만 보면 설립 비용이 커 보이지만 부담금은 매년 반복되는 돈입니다.")
save(im, "자회사형-표준사업장")

# 7. 장애인-고용부담금-신고기한 — 두 기한
im, d = base("기한이 두 개입니다", "장애인고용법 제33조")
cards(im, d, [
    {"제목": "1월 10일", "색": TXT_RED, "부제": "연계고용 감면 신청",
     "항목": ["부담금 신고보다 3주 빠릅니다", "이날이 지나면 그해는 끝입니다",
              "이미 거래 중이면 서류만 내면 됩니다"],
     "밴드": "여기서 가장 많이 놓칩니다", "밴드색": BAND_RED},
    {"제목": "1월 31일", "색": TXT_GOLD, "부제": "부담금 신고와 납부",
     "항목": ["고지서가 오지 않습니다", "스스로 계산해 신고합니다",
              "넘기면 부담금의 10%가 가산금"],
     "밴드": "감면 결과를 반영해 신고합니다", "밴드색": BAND_GOLD},
])
footer(d, "1월에 할 수 있는 일은 계산과 제출뿐입니다",
       "금액을 줄이는 일은 그 전 해에 끝나 있어야 합니다. 지금이 그 시기입니다.")
save(im, "장애인-고용부담금-신고기한")

# 8. 장애인-고용부담금-미신고-가산금 — 두 갈래
im, d = base("신고를 안 한 것과 납부가 늦은 것", "장애인고용법 제35조")
cards(im, d, [
    {"제목": "신고하지 않았다", "색": TXT_RED, "부제": "기한 안에 신고서를 내지 않은 경우",
     "항목": ["부담금의 100분의 10", "나중에 낸다고 없어지지 않습니다",
              "해마다 하나씩 더 붙습니다"],
     "밴드": "가산금", "밴드색": BAND_RED},
    {"제목": "납부가 늦었다", "색": TXT_GOLD, "부제": "신고는 했는데 돈이 늦은 경우",
     "항목": ["가산금은 붙지 않습니다", "지연된 기간만큼 계산됩니다"],
     "밴드": "연체금", "밴드색": BAND_GOLD},
])
footer(d, "돈이 준비되지 않아도 신고는 하십시오",
       "신고까지 미루면 가산금과 연체금이 함께 붙습니다.")
save(im, "장애인-고용부담금-미신고-가산금")

# 9. 장애인-고용부담금-절감-사례 — 비교표
im, d = base("한 명 차이로 이만큼 갈립니다", "상시 300명 · 의무 9명 가정")
table(im, d,
      ["고용 인원", "부족", "이행 구간", "단가", "연 부담금"],
      [["6명", "3명", "1/2 이상 3/4 미만", "1,372,700원", "약 4,942만원"],
       ["7명", "2명", "3/4 이상", "1,295,000원", "약 3,108만원"]],
      강조=1, 폭=[0.15, 0.12, 0.30, 0.20, 0.23])
d.text((60 * S, 330 * S), "한 명을 더 채용했더니 1,834만원이 줄었습니다",
       font=f(BD, 20), fill=TXT_GOLD, anchor="lm")
d.text((60 * S, 372 * S), "부족 인원이 한 명 줄어든 것만으로는 이만큼 나오지 않습니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
d.text((60 * S, 402 * S), "구간이 바뀌면서 남아 있는 2명분의 단가까지 함께 내려갔기 때문입니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "위 숫자는 구조를 보여드리기 위한 가정입니다",
       "실제 금액은 월평균 상시근로자 수와 채용 시기에 따라 달라집니다.")
save(im, "장애인-고용부담금-절감-사례")

print("\n끝")
