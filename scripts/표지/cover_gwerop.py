# -*- coding: utf-8 -*-
"""직장 내 괴롭힘 사업주 트랙 6편 대표이미지"""
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
    p = os.path.join(OUT, slug)
    os.makedirs(p, exist_ok=True)
    dest = os.path.join(p, "1.webp")
    im.resize((1200, 630), Image.LANCZOS).save(dest, "WEBP", quality=88, method=6)
    print(f"  {slug}/1.webp  {os.path.getsize(dest)//1024}KB")


# 1. 괴롭힘-가해자-징계-절차
im, d = base("조치 의무와 징계 절차는 별개입니다", "근로기준법 제76조의3 제5항")
cards(im, d, [
    {"제목": "근로기준법", "색": TXT_GOLD, "부제": "확인되면 지체 없이 행위자 조치",
     "항목": ["징계, 근무장소 변경 등 필요한 조치", "조치 전에 피해근로자 의견 청취",
              "안 하면 500만원 이하 과태료"],
     "밴드": "미루면 조치를 안 한 것이 됩니다", "밴드색": BAND_GOLD},
    {"제목": "취업규칙", "색": TXT_RED, "부제": "징계는 따로 절차를 밟습니다",
     "항목": ["징계 사유가 규정에 있어야 합니다", "징계위원회와 소명 기회",
              "안 지키면 징계 자체가 무효"],
     "밴드": "조사보고서는 징계 사유서가 아닙니다", "밴드색": BAND_RED},
])
footer(d, "양정은 과거 유사 사안과 견줍니다",
       "비슷한 비위에 경고로 끝낸 전례가 있으면 이번의 차이를 설명해야 합니다.")
save(im, "괴롭힘-가해자-징계-절차")

# 2. 괴롭힘-조사-주체
im, d = base("이 사람이 조사했다고 하면 수긍하겠는가", "근로기준법 제76조의3 제2항")
y = table(d, ["이런 조사는", "왜 문제인가"],
          [["가해자로 지목된 사람이 직접 참여", "조사 대상이 조사자입니다"],
           ["가해자의 직속 부하가 조사", "지휘를 받는 관계입니다"],
           ["대표가 지목됐는데 인사팀이 조사", "인사팀이 대표의 지휘를 받습니다"],
           ["조사자가 당사자와 이해관계", "중립성이 없습니다"]],
          강조=2, 폭=[0.46, 0.54])
d.text((60 * S, (y + 40) * S), "법은 조사자를 지정하지 않지만 「객관적으로」가 조사자를 제한합니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "기준은 회사 내부의 신뢰가 아닙니다",
       "상대방이 받아들일 수 있는지가 기준이고, 없으면 조사만 외부에 맡기면 됩니다.")
save(im, "괴롭힘-조사-주체")

# 3. 괴롭힘-가해자-분리
im, d = base("신고자를 옮기면 신고한 대가로 읽힙니다", "근로기준법 제76조의3 제3항")
y = table(d, ["이렇게 하면", "무엇이 문제인가"],
          [["신고자를 다른 부서로 보냅니다", "원하지 않으면 의사에 반하는 조치입니다"],
           ["신고자에게 휴가를 쓰게 합니다", "유급이어야 하고 의사를 확인해야 합니다"],
           ["신고자를 집에서 대기시킵니다", "무급이면 불리한 처우로 다투어집니다"],
           ["지목된 사람만 그대로 둡니다", "신고했더니 내가 밀려난 구조입니다"]],
          강조=2, 폭=[0.42, 0.58])
d.text((60 * S, (y + 40) * S), "옮겨야 할 사람은 대개 지목된 쪽입니다. 임시 조치임을 문서로 밝히십시오.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "먼저 물어보셨습니까",
       "피해근로자의 의사에 반하는 조치는 하지 못하도록 법에 정해져 있습니다.")
save(im, "괴롭힘-가해자-분리")

# 4. 괴롭힘-조사보고서
im, d = base("조사보고서에 남겨야 하는 여섯 가지", "근로기준법 제76조의3")
steps(im, d, [
    ("1", "접수 경위와 날짜", "「지체 없이」 조사했는지의 기준이 됩니다"),
    ("2", "조사자와 방법", "객관적으로 조사했는지를 봅니다"),
    ("3", "당사자·참고인 진술", "요약하지 말고 기록을 따로 붙이십시오"),
    ("4", "확인된 사실", "확인되지 않은 것도 그대로 적습니다"),
    ("5", "판단과 그 이유", "사실과 판단을 나눠 씁니다"),
    ("6", "조치 의견", "다음 단계의 출발점입니다"),
])
footer(d, "결론만 있고 과정이 없으면 신뢰할 근거가 없습니다",
       "근로감독관도 심판위원도 회사 사정을 모른 채 이 문서로만 판단합니다.")
save(im, "괴롭힘-조사보고서")

# 5. 괴롭힘-미대응-과태료
im, d = base("무엇을 안 하면 얼마인가", "근로기준법 제109조 · 제116조")
y = table(d, ["무엇을 했나", "어떻게 되나", "근거"],
          [["조사·조치 미이행, 비밀 누설", "500만원 이하 과태료", "제116조 제2항"],
           ["사용자·그 친족인 근로자가 괴롭힘", "1천만원 이하 과태료", "제116조 제1항"],
           ["신고자·피해자에게 불리한 처우", "3년 이하 징역 또는 3천만원", "제109조"]],
          강조=2, 폭=[0.44, 0.34, 0.22])
d.text((60 * S, (y + 42) * S), "마지막 줄만 형사처벌입니다",
       font=f(BD, 20), fill=TXT_GOLD, anchor="lm")
d.text((60 * S, (y + 80) * S), "앞의 둘은 행정처분이고, 마지막은 수사와 재판을 거쳐 전과가 남습니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "조사는 무조건 하십시오",
       "괴롭힘이 아니라고 판단하는 것은 회사의 몫이지만, 조사를 안 한 것은 다툴 수 없습니다.")
save(im, "괴롭힘-미대응-과태료")

# 6. 괴롭힘-허위신고-징계
im, d = base("확인되지 않음과 허위는 다릅니다", "근로기준법 제76조의3 제6항")
y = table(d, ["조사 결과", "무엇을 뜻하나", "신고자 징계"],
          [["괴롭힘에 해당하지 않음", "사실은 있으나 요건에 못 미칩니다", "안 됩니다"],
           ["확인되지 않음", "판단할 자료가 부족합니다", "안 됩니다"],
           ["허위임이 확인됨", "없는 사실을 지어냈습니다", "검토할 수 있습니다"]],
          강조=2, 폭=[0.30, 0.46, 0.24])
d.text((60 * S, (y + 40) * S), "앞의 두 줄이 대부분이고, 이때 징계하면 불리한 처우가 됩니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
footer(d, "신고했다는 사실 자체가 보호 대상입니다",
       "평가·성과급·업무 배분처럼 겉으로 징계가 아닌 것도 함께 판단됩니다.")
save(im, "괴롭힘-허위신고-징계")

print("\n끝")
