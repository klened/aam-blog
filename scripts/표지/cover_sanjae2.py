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


def steps(im, d, items, top0=150):
    gap = 26
    cw = (1080 - gap * 2) / 3
    ch = 126
    for k, (no, name, note) in enumerate(items):
        r, c = divmod(k, 3)
        x = 60 + c * (cw + gap)
        y = top0 + r * (ch + 22)
        d.rounded_rectangle([x * S, y * S, (x + cw) * S, (y + ch) * S],
                            radius=11 * S, fill=CARD_A if r == 0 else CARD_B)
        d.ellipse([(x + 22) * S, (y + 20) * S, (x + 50) * S, (y + 48) * S], fill=NAVY)
        d.text(((x + 36) * S, (y + 34) * S), no, font=f(BD, 15), fill=(255, 255, 255), anchor="mm")
        d.text(((x + 60) * S, (y + 34) * S), name, font=f(BD, 18), fill=TXT_DARK, anchor="lm")
        yy = y + 68
        for ln in wrap(d, note, f(RG, 14), (cw - 44) * S):
            d.text(((x + 22) * S, yy * S), ln, font=f(RG, 14), fill=TXT_MUTE, anchor="lm")
            yy += 21


def save(im, slug):
    p = os.path.join(OUT, slug); os.makedirs(p, exist_ok=True)
    dest = os.path.join(p, "1.webp")
    im.resize((1200, 630), Image.LANCZOS).save(dest, "WEBP", quality=88, method=6)
    print(f"  {slug}/1.webp  {os.path.getsize(dest)//1024}KB")



# 1. 위험성평가-의무
im, d = base("위험성평가, 언제 무엇을 하나", "산업안전보건법 제36조")
y = table(d, ["종류", "언제"],
          [["최초평가", "사업장 성립 후 1개월 이내에 착수"],
           ["정기평가", "1년마다 · 앞의 결과를 재검토하는 것도 인정"],
           ["수시평가", "기계·설비·공정이 바뀌거나 사고가 났을 때"],
           ["상시평가", "매월 1회 + 주 단위 공유 + 매 작업일 TBM"]],
          강조=3, 폭=[0.24, 0.76])
d.text((60 * S, (y + 42) * S), "2026년 6월 1일부터 안 하면 과태료입니다",
       font=f(BD, 20), fill=TXT_RED, anchor="lm")
d.text((60 * S, (y + 80) * S), "근로자를 참여시켜야 하고 결과는 3년간 보존하며 근로자에게 안내해야 합니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "작년 서류와 똑같으면 안 한 것으로 읽힙니다",
       "적어 둔 위험요인에 개선 조치가 따라가지 않으면 오히려 불리해집니다.")
save(im, "위험성평가-의무")

# 2. 출퇴근-산재-인정
im, d = base("출퇴근길 사고, 어디서 갈리나", "산재보험법 제37조")
cards(im, d, [
    {"제목": "인정됩니다", "색": TXT_GOLD, "부제": "통상적인 경로와 방법",
     "항목": ["자가용·대중교통·자전거·도보 모두", "회사가 관여하지 않아도 됩니다",
              "사업주가 제공한 통근버스도 포함"],
     "밴드": "평소 다니던 길이면 됩니다", "밴드색": BAND_GOLD},
    {"제목": "빠집니다", "색": TXT_RED, "부제": "경로를 벗어나거나 중간에 다른 일을 보면",
     "항목": ["그 시간의 사고", "그 이후 이동 중의 사고까지",
              "다만 일상생활에 필요한 행위는 예외"],
     "밴드": "어디에 들렀는지가 결과를 정합니다", "밴드색": BAND_RED},
])
footer(d, "장보기·병원·아이 등하원은 예외로 인정됩니다",
       "영수증이 결정적입니다. 들른 사실과 그 시각이 함께 남기 때문입니다.")
save(im, "출퇴근-산재-인정")

# 3. 업무상질병판정위원회
im, d = base("질병 산재는 왜 오래 걸리나", "산재보험법 제38조")
y = table(d, ["단계", "기간"],
          [["소속기관장이 심의를 의뢰하기까지", "7일 이내"],
           ["위원회가 심의하고 통지하기까지", "20일 이내"],
           ["한 차례 연장", "10일까지"]],
          강조=1, 폭=[0.60, 0.40])
d.text((60 * S, (y + 42) * S), "위원회가 보는 것은 병의 유무가 아닙니다",
       font=f(BD, 20), fill=TXT_GOLD, anchor="lm")
d.text((60 * S, (y + 80) * S), "그 병이 업무 때문인지를 봅니다. 그래서 진단서만으로는 부족합니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "「몇 년 동안 무거운 것을 들었다」로는 안 됩니다",
       "하루 몇 시간, 어떤 자세로, 몇 년인지가 숫자로 적혀야 판단할 재료가 됩니다.")
save(im, "업무상질병판정위원회")

# 4. 안전보건관리책임자-선임
im, d = base("안전보건관리책임자는 뽑는 자리가 아닙니다", "산업안전보건법 제15조")
cards(im, d, [
    {"제목": "누가 맡나", "색": TXT_GOLD, "부제": "사업장을 실질적으로 총괄 관리하는 사람",
     "항목": ["공장이면 공장장", "현장이면 현장소장", "본사 임원은 맞지 않습니다"],
     "밴드": "사업장마다 각각 정합니다", "밴드색": BAND_GOLD},
    {"제목": "무엇을 총괄하나", "색": TXT_RED, "부제": "이름만 올려 두면 선임으로 보기 어렵습니다",
     "항목": ["재해 예방계획과 안전보건관리규정", "안전보건교육·작업환경측정",
              "재해 원인 조사와 재발 방지", "위험성평가의 실시"],
     "밴드": "예산과 결재 권한이 있어야 합니다", "밴드색": BAND_RED},
])
footer(d, "선임 대상은 업종과 규모로 정해집니다",
       "시행령 별표 2에서 우리 업종을 확인하시고, 건설공사는 공사금액으로 봅니다.")
save(im, "안전보건관리책임자-선임")

# 5. 안전보건진단-명령
im, d = base("진단 명령은 조사로 끝나지 않습니다", "산업안전보건법 제47조 · 제49조")
steps(im, d, [
    ("1", "진단을 받는다", "지정된 진단기관이 실시합니다"),
    ("2", "개선계획을 세운다", "진단 결과와 짝이 맞아야 합니다"),
    ("3", "그 계획을 시행한다", "이행 여부를 뒤에 확인받습니다"),
])
d.text((60 * S, 320 * S), "누가 받나", font=f(BD, 20), fill=TXT_GOLD, anchor="lm")
d.text((60 * S, 358 * S), "· 산업재해율이 같은 업종의 규모별 평균보다 높은 사업장",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
d.text((60 * S, 390 * S), "· 안전조치·보건조치를 이행하지 않아 중대재해가 발생한 사업장",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "중대재해가 원인이면 형사 절차와 함께 굴러갑니다",
       "진단 과정에서 나온 자료가 그쪽에서도 쓰이므로 따로 보시면 안 됩니다.")
save(im, "안전보건진단-명령")

# 6. 안전보건개선계획서
im, d = base("개선계획서는 제출이 아니라 약속입니다", "산업안전보건법 제49조")
y = table(d, ["무엇을", "왜 필요한가"],
          [["무엇을 고칠 것인가", "진단에서 나온 문제와 짝이 맞아야 합니다"],
           ["언제까지 할 것인가", "이행 확인의 기준이 됩니다"],
           ["누가 할 것인가", "결정할 수 있는 사람이어야 굴러갑니다"]],
          강조=2, 폭=[0.34, 0.66])
d.text((60 * S, (y + 42) * S), "기한을 짧게 적는 편이 유리하지 않습니다",
       font=f(BD, 20), fill=TXT_RED, anchor="lm")
d.text((60 * S, (y + 80) * S), "못 지키면 회사가 스스로 만든 기준이 그대로 불이행의 근거가 됩니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "당장 못 하는 것도 빼지 말고 적으십시오",
       "「예산 확보 후 다음 연도 시행」이 아예 빠뜨리는 것보다 낫습니다.")
save(im, "안전보건개선계획서")

print("끝")
