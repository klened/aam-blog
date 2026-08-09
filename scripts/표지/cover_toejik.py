# -*- coding: utf-8 -*-
"""퇴직금 6편 대표이미지"""
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



# 1. 퇴직금-계산-방법
im, d = base("퇴직금은 두 군데에서 어긋납니다", "근로자퇴직급여 보장법 제8조")
cards(im, d, [
    {"제목": "평균임금", "색": TXT_RED, "부제": "퇴직 전 3개월 임금 총액 ÷ 총일수",
     "항목": ["정기 상여금은 연간액의 3/12", "연차수당도 연간액의 3/12",
              "이 둘이 가장 자주 빠집니다"],
     "밴드": "빠지면 금액이 크게 내려갑니다", "밴드색": BAND_RED},
    {"제목": "계속근로기간", "색": TXT_GOLD, "부제": "1년 이상이어야 나옵니다",
     "항목": ["수습기간도 들어갑니다", "육아휴직 기간도 들어갑니다",
              "재입사 처리도 이어질 수 있습니다"],
     "밴드": "계약서가 아니라 실질로 봅니다", "밴드색": BAND_GOLD},
])
footer(d, "공식 자체는 어렵지 않습니다",
       "1일 평균임금 × 30일 × (계속근로일수 ÷ 365) 입니다.")
save(im, "퇴직금-계산-방법")

# 2. 퇴직금-평균임금-산입
im, d = base("평균임금에 무엇이 들어가나", "근로기준법 제2조")
y = table(d, ["무엇이", "어떻게 넣나"],
          [["기본급 · 연장·야간·휴일 수당", "3개월 실지급액"],
           ["정기 상여금", "연간 금액의 3/12"],
           ["전년도 미사용 연차수당", "연간 금액의 3/12"],
           ["경조사비 · 출장비 같은 실비", "들어가지 않습니다"]],
          강조=1, 폭=[0.44, 0.56])
d.text((60 * S, (y + 40) * S), "이름이 아니라 성격으로 봅니다. 정해진 때에 정해진 기준으로 모두에게 줬다면 임금입니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "평균임금이 통상임금보다 낮으면 통상임금으로 봅니다",
       "퇴직 직전에 일이 적어 수당이 줄었어도 그만큼 손해를 보지 않도록 바닥이 있습니다.")
save(im, "퇴직금-평균임금-산입")

# 3. 계속근로기간-판단
im, d = base("끊긴 것처럼 보여도 이어지는 경우", "근로자퇴직급여 보장법 제4조")
y = table(d, ["이런 경우", "어떻게 보나"],
          [["수습기간", "들어갑니다"],
           ["계약직에서 정규직으로 전환", "공백이 없으면 이어집니다"],
           ["형식상 사직서 내고 재입사", "실질이 이어졌으면 합산될 수 있습니다"],
           ["계약을 여러 번 갱신", "반복적으로 이어졌으면 하나로 봅니다"]],
          강조=2, 폭=[0.40, 0.60])
d.text((60 * S, (y + 40) * S), "주 소정근로시간 15시간 미만인 기간은 빠집니다. 근무 형태가 바뀐 시점을 확인하십시오.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "가장 강한 자료는 급여 입금 내역입니다",
       "매달 끊기지 않고 들어왔다면 그 자체가 관계가 이어졌다는 증거입니다.")
save(im, "계속근로기간-판단")

# 4. 퇴직금-중간정산-사유
im, d = base("중간정산은 원칙이 금지입니다", "근로자퇴직급여 보장법 시행령 제3조")
cards(im, d, [
    {"제목": "되는 사유", "색": TXT_GOLD, "부제": "시행령에 정해진 것만",
     "항목": ["무주택자의 주택 구입", "전세금·보증금 부담 (1회 한정)",
              "장기 요양 의료비 (금액 기준 초과)"],
     "밴드": "증명 서류를 받아 두십시오", "밴드색": BAND_GOLD},
    {"제목": "안 되는 것", "색": TXT_RED, "부제": "본인이 원해도 안 됩니다",
     "항목": ["생활비 · 학자금 · 대출 상환", "월급에 얹어 나눠 주기로 한 약정",
              "사유 없는 정산은 효력이 없습니다"],
     "밴드": "퇴직 때 그 기간분을 다시 줍니다", "밴드색": BAND_RED},
])
footer(d, "정산한 뒤에는 계속근로기간이 새로 시작됩니다",
       "인사기록의 기산일을 안 고치면 퇴직할 때 전체 기간으로 다시 계산하게 됩니다.")
save(im, "퇴직금-중간정산-사유")

# 5. 퇴직금-미지급-신고
im, d = base("14일이 지났으면 이미 위반입니다", "근로자퇴직급여 보장법 제9조 · 제44조")
y = table(d, ["무엇이", "내용"],
          [["지급 기한", "퇴직일부터 14일 이내"],
           ["지연이자", "14일 다음 날부터 연 20%"],
           ["형사처벌", "3년 이하 징역 또는 3천만원 이하 벌금"],
           ["성격", "반의사불벌죄 — 처벌을 원하지 않으면 기소되지 않습니다"]],
          강조=3, 폭=[0.24, 0.76])
d.text((60 * S, (y + 40) * S), "신고는 고용노동부 노동포털에서 진정으로 접수합니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "돈을 받기 전에 취하하지 마십시오",
       "회사가 이미 어렵다면 대지급금 쪽이 현실적입니다. 시효는 3년입니다.")
save(im, "퇴직금-미지급-신고")

# 6. 퇴직연금-의무화
im, d = base("지금 의무인 것과 아직 아닌 것", "근로자퇴직급여 보장법 제4조")
y = table(d, ["무엇이", "지금 상태"],
          [["퇴직급여제도를 두는 것", "의무입니다 — 퇴직금과 퇴직연금 중 선택"],
           ["새로 설립한 사업장", "의무입니다 — 1년 내 퇴직연금 우선 설정"],
           ["기존 사업장 전부의 퇴직연금 전환", "아직 아닙니다 — 추진 방향입니다"]],
          강조=2, 폭=[0.40, 0.60])
d.text((60 * S, (y + 42) * S), "2026년 2월 노사정 공동선언문의 추진 과제입니다",
       font=f(BD, 20), fill=TXT_GOLD, anchor="lm")
d.text((60 * S, (y + 80) * S), "기금형 활성화와 사외적립 의무화가 과제이고, 시행 시기가 정해진 것은 없습니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "아무 제도도 없으면 그것이 지금 위반입니다",
       "의무화 논의보다 이쪽이 훨씬 급합니다. 먼저 확인해 보십시오.")
save(im, "퇴직연금-의무화")

print("끝")
