# -*- coding: utf-8 -*-
"""산재 근로자 트랙 6편 대표이미지"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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
        d.text((((xs[i] + xs[i + 1]) / 2) * S, (top + rh / 2) * S), t,
               font=f(BD, 16), fill=(255, 255, 255), anchor="mm")
    y = top + rh
    for r, row in enumerate(줄들):
        bg = (250, 246, 240) if r == 강조 else (WHITE if r % 2 == 0 else (248, 250, 253))
        d.rectangle([left * S, y * S, right * S, (y + rh) * S], fill=bg)
        d.line([left * S, (y + rh) * S, right * S, (y + rh) * S], fill=LINE, width=1)
        for i, t in enumerate(row):
            d.text((((xs[i] + xs[i + 1]) / 2) * S, (y + rh / 2) * S), t,
                   font=f(BD if r == 강조 or i == 0 else RG, 16),
                   fill=(TXT_RED if r == 강조 else TXT_DARK), anchor="mm")
        y += rh
    return y


def save(im, slug):
    p = os.path.join(OUT, slug)
    os.makedirs(p, exist_ok=True)
    dest = os.path.join(p, "1.webp")
    im.resize((1200, 630), Image.LANCZOS).save(dest, "WEBP", quality=88, method=6)
    print(f"  {slug}/1.webp  {os.path.getsize(dest)//1024}KB")


# 1. 산재-처리기간
im, d = base("법정 7일에 들어가지 않는 기간", "산재보험법 제41조")
y = table(d, ["처리기간 7일에 산입되지 않는 것", "언제 생기나"],
          [["업무상질병판정위원회 심의", "질병으로 신청한 경우"],
           ["사업장·의료기관 조사", "사실관계 확인이 필요한 경우"],
           ["공단의 진찰 요구에 따른 진찰", "상태 확인이 필요한 경우"]],
          강조=0, 폭=[0.52, 0.48])
d.text((60 * S, (y + 40) * S), "사고는 몇 주, 질병은 몇 달이 걸리는 것이 보통입니다",
       font=f(BD, 20), fill=TXT_GOLD, anchor="lm")
d.text((60 * S, (y + 78) * S), "질병은 심의 의뢰까지 7일, 심의에 20일이 걸리고 10일까지 연장됩니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "조사가 시작되면 시계가 멈춥니다",
       "7일은 조사가 필요 없는 사건의 기준이고 대부분은 여기에 해당하지 않습니다.")
save(im, "산재-처리기간")

# 2. 산재-휴업급여
im, d = base("휴업급여는 평균임금의 70%입니다", "산재보험법 제52조")
cards(im, d, [
    {"제목": "얼마를", "색": TXT_GOLD, "부제": "하루당 평균임금의 100분의 70",
     "항목": ["근로기준법 휴업보상은 60%", "요양으로 취업하지 못한 기간",
              "3일 이내이면 지급되지 않습니다"],
     "밴드": "비율은 정해져 있습니다", "밴드색": BAND_GOLD},
    {"제목": "언제부터", "색": TXT_RED, "부제": "승인이 난 뒤에 소급해서",
     "항목": ["기다리는 동안에는 들어오지 않습니다", "승인되면 한꺼번에 지급됩니다",
              "못 받는 것이 아니라 늦게 받습니다"],
     "밴드": "그전까지는 스스로 버텨야 합니다", "밴드색": BAND_RED},
])
footer(d, "금액은 평균임금에서 갈립니다",
       "연장·야간 수당이 빠지면 하루 몇만원이 치료 기간 내내 곱해집니다.")
save(im, "산재-휴업급여")

# 3. 산재-병원비
im, d = base("무엇이 처리되고 무엇이 남나", "산재보험법 제40조")
y = table(d, ["무엇이", "어떻게 되나"],
          [["급여 항목", "요양급여로 처리 · 공단이 병원에 직접 지급"],
           ["비급여 항목", "본인 부담으로 남습니다"],
           ["승인 전 치료비", "일단 본인이 내고 나중에 정산합니다"],
           ["3일 이내에 나을 부상", "요양급여가 지급되지 않습니다"]],
          강조=1, 폭=[0.30, 0.70])
d.text((60 * S, (y + 40) * S), "요양급여의 범위는 건강보험 요양급여기준을 따릅니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "초진 기록이 사건을 좌우합니다",
       "업무 중에 다쳤다는 사실을 처음부터 말씀하셔야 경위가 기록에 남습니다.")
save(im, "산재-병원비")

# 4. 산재-장해등급
im, d = base("등급에 따라 받는 방식이 달라집니다", "산재보험법 제57조")
y = table(d, ["장해등급", "어떻게 받나"],
          [["제1급 ~ 제3급", "장해보상연금으로만 지급됩니다"],
           ["제4급 ~ 제7급", "연금과 일시금 중에 선택합니다"],
           ["제8급 ~ 제14급", "장해보상일시금으로만 지급됩니다"]],
          강조=2, 폭=[0.30, 0.70])
d.text((60 * S, (y + 42) * S), "7급과 8급 사이가 가장 큰 경계입니다",
       font=f(BD, 20), fill=TXT_GOLD, anchor="lm")
d.text((60 * S, (y + 80) * S), "7급이면 평생 받는 연금을 고를 수 있고, 8급이면 한 번 받고 끝납니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "등급은 검사 결과로 정해집니다",
       "「아프다」는 진술만으로는 올라가지 않고, 남은 기능을 수치로 보여줘야 합니다.")
save(im, "산재-장해등급")

# 5. 산재-이의신청-기간
im, d = base("불복 절차는 두 단계, 각각 90일", "산재보험법 제103조 · 제106조")
cards(im, d, [
    {"제목": "심사청구", "색": TXT_RED, "부제": "근로복지공단에 합니다",
     "항목": ["결정이 있음을 안 날부터 90일", "결정이 내려진 날이 아닙니다",
              "통지서 받은 날을 기억하십시오"],
     "밴드": "첫 번째 기한", "밴드색": BAND_RED},
    {"제목": "재심사청구", "색": TXT_GOLD, "부제": "산업재해보상보험재심사위원회에 합니다",
     "항목": ["심사청구 결정을 안 날부터 90일", "심사청구에서 안 되어도 끝이 아닙니다"],
     "밴드": "두 번째 기한", "밴드색": BAND_GOLD},
])
footer(d, "기한을 넘기면 내용이 옳아도 다투지 못합니다",
       "불승인만이 아니라 낮은 장해등급과 적게 잡힌 평균임금도 대상입니다.")
save(im, "산재-이의신청-기간")

# 6. 산재-합의금
im, d = base("보험급여와 손해배상은 다른 것입니다", "산재보험법 제80조")
cards(im, d, [
    {"제목": "산재보험급여", "색": TXT_GOLD, "부제": "근로복지공단이 지급합니다",
     "항목": ["회사의 잘못을 따지지 않습니다", "치료비·휴업급여·장해급여",
              "정해진 기준대로 나옵니다"],
     "밴드": "잘못이 없어도 나옵니다", "밴드색": BAND_GOLD},
    {"제목": "회사에 대한 손해배상", "색": TXT_RED, "부제": "회사에 책임이 있어야 합니다",
     "항목": ["보험급여로 메워지지 않는 손해", "같은 사유는 그 한도에서 조정",
              "겹치지 않는 부분이 남습니다"],
     "밴드": "합의서 문구가 가릅니다", "밴드색": BAND_RED},
])
footer(d, "금액보다 시점과 문구를 먼저 보십시오",
       "치료가 끝나기 전 합의는 앞으로 얼마가 들지 모르는 상태에서 정하는 것입니다.")
save(im, "산재-합의금")

print("\n끝")
