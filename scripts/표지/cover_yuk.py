# -*- coding: utf-8 -*-
"""육아휴직·출산휴가 6편 대표이미지"""
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


def f(p, s): return ImageFont.truetype(p, s * S)
def w(d, t, font): return d.textlength(t, font=font)


def wrap(d, text, font, maxw):
    out, line = [], ""
    for ch in text:
        if w(d, line + ch, font) > maxw and line:
            out.append(line); line = ch
        else:
            line += ch
    if line: out.append(line)
    return out


def base(title, source):
    im = Image.new("RGB", (W, H), WHITE)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 100 * S], fill=NAVY)
    size = 34
    while w(d, title, f(BD, size)) > 920 * S and size > 23:
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
    ts = 24 if n <= 2 else (21 if n == 3 else 19)
    ss = 15 if n <= 3 else 13
    isz = 16 if n <= 2 else (15 if n == 3 else 13)
    for k, c in enumerate(items):
        x = 60 + k * (cw + gap)
        d.rounded_rectangle([x * S, top * S, (x + cw) * S, bot * S], radius=12 * S,
                            fill=CARD_A if k % 2 == 0 else CARD_B)
        tx, maxw = (x + pad) * S, (cw - pad * 2) * S
        d.text((tx, (top + 44) * S), c["제목"], font=f(BD, ts), fill=c["색"], anchor="lm")
        y = top + 76
        for ln in wrap(d, c.get("부제", ""), f(RG, ss), maxw):
            d.text((tx, y * S), ln, font=f(RG, ss), fill=TXT_MUTE, anchor="lm"); y += ss + 7
        y += 12
        for it in c.get("항목", []):
            for j, ln in enumerate(wrap(d, it, f(RG, isz), maxw - 12 * S)):
                d.text((tx, y * S), ("· " if j == 0 else "  ") + ln,
                       font=f(RG, isz), fill=TXT_DARK, anchor="lm"); y += isz + 9
        if c.get("밴드"):
            bh, by = 36, bot - 56
            d.rounded_rectangle([tx, by * S, (x + cw - pad) * S, (by + bh) * S],
                                radius=7 * S, fill=c.get("밴드색", BAND_GOLD))
            d.text(((x + cw / 2) * S, (by + bh / 2) * S), c["밴드"],
                   font=f(BD, 15 if n <= 2 else (13 if n == 3 else 12)),
                   fill=(255, 255, 255), anchor="mm")


def table(d, 머리, 줄들, 강조=-1, 폭=None, top=150, rh=44):
    n = len(머리); left, right = 60, 1140
    폭 = 폭 or [1 / n] * n
    xs, acc = [], left
    for p in 폭:
        xs.append(acc); acc += (right - left) * p
    xs.append(right)
    d.rounded_rectangle([left * S, top * S, right * S, (top + rh) * S], radius=8 * S, fill=NAVY)
    for i, t in enumerate(머리):
        d.text((((xs[i] + xs[i+1]) / 2) * S, (top + rh / 2) * S), t, font=f(BD, 16),
               fill=(255, 255, 255), anchor="mm")
    y = top + rh
    for r, row in enumerate(줄들):
        bg = (250, 246, 240) if r == 강조 else (WHITE if r % 2 == 0 else (248, 250, 253))
        d.rectangle([left * S, y * S, right * S, (y + rh) * S], fill=bg)
        d.line([left * S, (y + rh) * S, right * S, (y + rh) * S], fill=LINE, width=1)
        for i, t in enumerate(row):
            d.text((((xs[i] + xs[i+1]) / 2) * S, (y + rh / 2) * S), t,
                   font=f(BD if r == 강조 or i == 0 else RG, 16),
                   fill=(TXT_RED if r == 강조 else TXT_DARK), anchor="mm")
        y += rh
    return y


def save(im, slug):
    p = os.path.join(OUT, slug); os.makedirs(p, exist_ok=True)
    dest = os.path.join(p, "1.webp")
    im.resize((1200, 630), Image.LANCZOS).save(dest, "WEBP", quality=88, method=6)
    print(f"  {slug}/1.webp  {os.path.getsize(dest)//1024}KB")


# 1. 육아휴직-급여-얼마
im, d = base("육아휴직 급여는 두 번 내려갑니다", "고용보험법 제70조")
y = table(d, ["기간", "지급률", "상한", "하한"],
          [["1~3개월", "통상임금 100%", "250만원", "70만원"],
           ["4~6개월", "통상임금 100%", "200만원", "70만원"],
           ["7개월~종료", "통상임금 80%", "160만원", "70만원"]],
          강조=2, 폭=[0.26, 0.30, 0.22, 0.22])
d.text((60 * S, (y + 42) * S), "부부가 함께 쓰면 첫 6개월 상한이 최대 450만원까지 올라갑니다",
       font=f(BD, 20), fill=TXT_GOLD, anchor="lm")
d.text((60 * S, (y + 80) * S), "같은 자녀에 대해 출생 후 18개월 이내에 부모가 모두 육아휴직을 쓴 경우입니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "통상임금이 상한보다 높으면 상한액을 받습니다",
       "월급이 300만원이든 500만원이든 첫 3개월은 250만원입니다.")
save(im, "육아휴직-급여-얼마")

# 2. 배우자-출산휴가-20일
im, d = base("배우자 출산휴가, 정해진 것은 넷입니다", "남녀고용평등법 제18조의2")
y = table(d, ["무엇을", "기준"],
          [["일수", "20일"],
           ["임금", "유급입니다"],
           ["기한", "출산일부터 120일이 지나면 쓸 수 없습니다"],
           ["분할", "3회까지 나눠 쓸 수 있습니다"]],
          강조=1, 폭=[0.24, 0.76])
d.text((60 * S, (y + 40) * S), "주지 않거나 무급으로 처리하면 500만원 이하의 과태료입니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "청구가 아니라 고지입니다",
       "직원이 허락을 구하는 것이 아니라 알리는 것이고, 회사는 주어야 합니다.")
save(im, "배우자-출산휴가-20일")

# 3. 육아휴직-복직-거부
im, d = base("임금만 같으면 되는 것이 아닙니다", "대법원 2017두76005")
cards(im, d, [
    {"제목": "같은 업무인가", "색": TXT_GOLD, "부제": "규정만이 아니라 실제 수행 업무를 봅니다",
     "항목": ["직책·직위의 성격과 내용", "범위·권한·책임",
              "사회통념상 차이가 없어야 합니다"],
     "밴드": "명함·조직도·업무분장표를 모으십시오", "밴드색": BAND_GOLD},
    {"제목": "다른 직무로 보냈다면", "색": TXT_RED, "부제": "실질적 불이익이 없어야 합니다",
     "항목": ["다른 직무를 줘야 할 필요성", "권한과 책임에서의 불이익",
              "기존 업무상·생활상 이익의 상실", "복직 전 사전 협의를 했는지"],
     "밴드": "협의 없이 통보만 했다면 그것도 판단 요소", "밴드색": BAND_RED},
])
footer(d, "「자리가 없다」는 답이 되지 않습니다",
       "휴직 기간에 그 자리를 어떻게 운영할지는 회사가 계획할 일입니다.")
save(im, "육아휴직-복직-거부")

# 4. 육아휴직-대체인력-지원금
im, d = base("거부하면 벌금, 채용하면 지원금", "남녀고용평등법 제37조")
cards(im, d, [
    {"제목": "거부한다", "색": TXT_RED, "부제": "요건을 갖춘 신청을 막는 경우",
     "항목": ["500만원 이하의 벌금입니다", "과태료가 아닙니다",
              "그러고도 결국 휴직은 주게 됩니다"],
     "밴드": "처벌까지 받고 인력 문제도 남습니다", "밴드색": BAND_RED},
    {"제목": "대체인력을 뽑는다", "색": TXT_GOLD, "부제": "우선지원 대상기업이 대상입니다",
     "항목": ["출산육아기 고용안정장려금", "인수인계 기간을 앞뒤로 두십시오",
              "그 기간에 다른 직원을 내보내면 막힙니다"],
     "밴드": "채용 시점에 요건이 정해집니다", "밴드색": BAND_GOLD},
])
footer(d, "사람을 다 뽑고 나서 알아보면 늦습니다",
       "인수인계 기간과 계약 형태가 채용 공고와 근로계약서에서 이미 갈립니다.")
save(im, "육아휴직-대체인력-지원금")

# 5. 육아휴직-후-퇴사
im, d = base("퇴직금은 줄지 않는 구조입니다", "남녀고용평등법 제19조")
y = table(d, ["무엇에", "육아휴직 기간이"],
          [["근속기간", "포함됩니다 — 1년을 쉬어도 근속이 줄지 않습니다"],
           ["평균임금", "빠집니다 — 임금이 없던 기간이라 넣으면 금액이 낮아집니다"]],
          강조=1, 폭=[0.24, 0.76])
d.text((60 * S, (y + 42) * S), "실업급여는 사유에서 갈립니다",
       font=f(BD, 20), fill=TXT_GOLD, anchor="lm")
d.text((60 * S, (y + 80) * S), "복직 거부, 전혀 다른 자리 발령, 퇴사 권유가 있었다면 자발적 퇴사로만 보기 어렵습니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "사직서를 먼저 내지 마십시오",
       "복직 신청과 회사의 답변을 문서로 남긴 뒤에 판단하셔야 합니다.")
save(im, "육아휴직-후-퇴사")

# 6. 육아휴직-후-권고사직
im, d = base("회사가 해고라고 말하지 않는 이유", "남녀고용평등법 제19조 · 제37조")
y = table(d, ["", "권고사직", "해고"],
          [["누가 끝냈나", "본인이 동의", "회사가 일방적으로"],
           ["서류", "사직서", "해고 통지"],
           ["구제신청", "어렵습니다", "3개월 안에 가능"],
           ["회사의 위험", "거의 없습니다", "형사처벌"]],
          강조=3, 폭=[0.26, 0.37, 0.37])
d.text((60 * S, (y + 40) * S), "육아휴직을 이유로 한 해고는 3년 이하 징역 또는 3천만원 이하 벌금입니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "그 자리에서 서명하지 마십시오",
       "「생각해 보겠다」로 충분하고, 오늘 답을 드려야 할 의무가 없습니다.")
save(im, "육아휴직-후-권고사직")

print("\n끝")
