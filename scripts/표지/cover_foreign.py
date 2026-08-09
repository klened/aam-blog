# -*- coding: utf-8 -*-
"""외국인 고용 6편 대표이미지"""
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
    d.text((60 * S, 50 * S), title, font=f(BD, 34), fill=(255, 255, 255), anchor="lm")
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
        fill = CARD_A if k % 2 == 0 else CARD_B
        d.rounded_rectangle(
            [x * S, top * S, (x + cw) * S, bot * S], radius=12 * S, fill=fill
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
            lines = wrap(d, it, f(RG, i_size), maxw - 12 * S)
            for j, ln in enumerate(lines):
                pre = "· " if j == 0 else "  "
                d.text((tx, y * S), pre + ln, font=f(RG, i_size), fill=TXT_DARK, anchor="lm")
                y += i_size + 9

        if c.get("밴드"):
            bh = 36
            by = bot - 20 - bh
            d.rounded_rectangle(
                [tx, by * S, (x + cw - pad) * S, (by + bh) * S],
                radius=7 * S,
                fill=c.get("밴드색", BAND_GOLD),
            )
            bf = f(BD, 15 if n <= 2 else (13 if n == 3 else 12))
            d.text(
                ((x + cw / 2) * S, (by + bh / 2) * S),
                c["밴드"],
                font=bf,
                fill=(255, 255, 255),
                anchor="mm",
            )


def steps(im, d, items):
    """3열 2행 단계 상자"""
    gap = 26
    cw = (1080 - gap * 2) / 3
    ch = 118
    for k, (no, name, note) in enumerate(items):
        r, c = divmod(k, 3)
        x = 60 + c * (cw + gap)
        y = 150 + r * (ch + 24)
        d.rounded_rectangle(
            [x * S, y * S, (x + cw) * S, (y + ch) * S],
            radius=11 * S,
            fill=CARD_A if r == 0 else CARD_B,
        )
        d.ellipse(
            [(x + 22) * S, (y + 20) * S, (x + 50) * S, (y + 48) * S],
            fill=NAVY,
        )
        d.text(((x + 36) * S, (y + 34) * S), no, font=f(BD, 15), fill=(255, 255, 255), anchor="mm")
        d.text(((x + 60) * S, (y + 34) * S), name, font=f(BD, 19), fill=TXT_DARK, anchor="lm")
        yy = y + 66
        for ln in wrap(d, note, f(RG, 14), (cw - 44) * S):
            d.text(((x + 22) * S, yy * S), ln, font=f(RG, 14), fill=TXT_MUTE, anchor="lm")
            yy += 21


def save(im, slug):
    p = os.path.join(OUT, slug)
    os.makedirs(p, exist_ok=True)
    small = im.resize((1200, 630), Image.LANCZOS)
    dest = os.path.join(p, "1.webp")
    small.save(dest, "WEBP", quality=88, method=6)
    print(f"  {slug}/1.webp  {os.path.getsize(dest)//1024}KB")


# 1. 외국인-불법고용-처벌
im, d = base("취업자격 없는 외국인을 고용하면", "출입국관리법 제18조 · 제94조")
cards(im, d, [
    {"제목": "출입국관리법", "색": TXT_RED, "부제": "고용한 사람도 함께 처벌됩니다",
     "항목": ["자격 없는 외국인을 고용", "수사와 재판을 거칩니다", "외국인 고용 제한이 따라옵니다"],
     "밴드": "3년 이하 징역 또는 3천만원 이하 벌금", "밴드색": BAND_RED},
    {"제목": "노동법상 의무", "색": TXT_GOLD, "부제": "처벌을 받아도 그대로 남습니다",
     "항목": ["임금과 퇴직금을 지급", "다치면 산재보험 적용", "근로기준법이 그대로 적용"],
     "밴드": "근로계약은 당연무효가 아닙니다", "밴드색": BAND_GOLD},
])
footer(d, "둘 중 하나를 고르는 것이 아닙니다",
       "대법원은 취업자격이 없어도 근로기준법상 근로자에 해당한다고 봅니다.")
save(im, "외국인-불법고용-처벌")

# 2. 외국인-고용허가제-절차
im, d = base("외국인 고용허가제, 진행 순서", "외국인고용법 제8조")
steps(im, d, [
    ("1", "내국인 구인", "먼저 국내에서 사람을 구해 봐야 합니다"),
    ("2", "고용허가 신청", "내국인을 채용하지 못한 경우에 신청합니다"),
    ("3", "허가서 발급", "구직자 명부에서 알선을 받아 선정합니다"),
    ("4", "표준근로계약", "정해진 서식으로 체결합니다"),
    ("5", "입국·취업교육", "입국 뒤 교육을 거칩니다"),
    ("6", "사후 신고", "변동이 생기면 기한 안에 신고합니다"),
])
footer(d, "1단계를 건너뛸 수 없습니다",
       "각 단계에 기한이 있어 하나를 놓치면 앞 단계부터 다시 해야 합니다.")
save(im, "외국인-고용허가제-절차")

# 3. 외국인-고용-단속-대비
im, d = base("단속에서 확인하는 세 가지", "출입국관리법 제18조")
cards(im, d, [
    {"제목": "체류자격", "색": TXT_RED, "부제": "취업할 수 있는 자격인가",
     "항목": ["채용 당시 사본만 갖고 있는 경우", "체류기간이 이미 지난 경우"],
     "밴드": "만료일을 모아 관리하십시오", "밴드색": BAND_RED},
    {"제목": "사업장 적합성", "색": TXT_GOLD, "부제": "이 업종·이 사업장에서 일할 수 있는가",
     "항목": ["절차 없이 다른 곳에서 받은 경우", "등록된 곳이 아닌 현장에 보낸 경우"],
     "밴드": "자격이 있어도 위반이 됩니다", "밴드색": BAND_GOLD},
    {"제목": "신고 이행", "색": TXT_GOLD, "부제": "기한 안에 신고했는가",
     "항목": ["변동사항을 빠뜨린 경우", "본래 위반과 별개로 쌓입니다"],
     "밴드": "과태료가 따로 붙습니다", "밴드색": BAND_NAVY},
])
footer(d, "등록증 확인만으로는 갈리지 않습니다",
       "확인은 채용 시점 한 번이 아니라 지금 유효한지를 보는 일입니다.")
save(im, "외국인-고용-단속-대비")

# 4. 외국인-고용-과태료-항목
im, d = base("벌금과 과태료는 다릅니다", "출입국관리법 제94조 · 외국인고용법")
cards(im, d, [
    {"제목": "벌금", "색": TXT_RED, "부제": "자격 없는 외국인을 고용",
     "항목": ["형사처벌입니다", "수사와 재판을 거칩니다", "전과가 남습니다"],
     "밴드": "3년 이하 징역 또는 3천만원", "밴드색": BAND_RED},
    {"제목": "과태료", "색": TXT_GOLD, "부제": "변동사항 신고 누락",
     "항목": ["행정처분입니다", "본래 사안과 별개로 붙습니다", "회사가 알 수 있는 사항입니다"],
     "밴드": "신고 항목마다 따로", "밴드색": BAND_GOLD},
    {"제목": "고용 제한", "색": TXT_GOLD, "부제": "위반이 확인된 사업장",
     "항목": ["나가도 새로 받을 수 없습니다", "고용허가 신청도 막힙니다", "가장 오래 남습니다"],
     "밴드": "일정 기간 채용 불가", "밴드색": BAND_NAVY},
])
footer(d, "「얼마 내나」가 아니라 「몇 년 못 뽑나」입니다",
       "벌금은 한 번으로 끝나지만 고용 제한은 인력 운용 전체를 흔듭니다.")
save(im, "외국인-고용-과태료-항목")

# 5. 외국인근로자-4대보험
im, d = base("외국인 4대보험, 넷이 각각 다릅니다", "근로기준법 제6조")
cards(im, d, [
    {"제목": "산재보험", "색": TXT_RED, "부제": "갈리지 않습니다",
     "항목": ["체류자격과 무관", "불법체류라도 적용", "빼 두면 사고 때 가장 큽니다"],
     "밴드": "무조건 적용", "밴드색": BAND_RED},
    {"제목": "건강보험", "색": TXT_GOLD, "부제": "사업장 근무 기준",
     "항목": ["직장가입자로 가입", "외국인이라고 빠지지 않습니다"],
     "밴드": "직장가입", "밴드색": BAND_GOLD},
    {"제목": "국민연금", "색": TXT_GOLD, "부제": "국적을 봐야 합니다",
     "항목": ["상호주의 원칙", "사회보장협정", "제외되는 국가가 있습니다"],
     "밴드": "국가별로 갈림", "밴드색": BAND_NAVY},
    {"제목": "고용보험", "색": TXT_GOLD, "부제": "체류자격을 봐야 합니다",
     "항목": ["거주·영주·결혼이민은 당연적용", "그 밖에는 신청 가입"],
     "밴드": "자격별로 갈림", "밴드색": BAND_NAVY},
])
footer(d, "「외국인이니까」로 답이 나오지 않습니다",
       "채용할 때 체류자격과 국적을 함께 적어 두면 넷이 한 번에 정리됩니다.")
save(im, "외국인근로자-4대보험")

# 6. 외국인근로자-산재보상
im, d = base("외국인이 다쳤을 때, 덮으면 겹칩니다", "근로기준법 제6조")
cards(im, d, [
    {"제목": "산재로 처리하면", "색": TXT_GOLD, "부제": "체류자격과 무관하게 적용됩니다",
     "항목": ["보험으로 처리됩니다", "회사 돈이 나가지 않습니다", "보고 의무를 지킨 것이 됩니다"],
     "밴드": "한 가지 문제로 끝납니다", "밴드색": BAND_GOLD},
    {"제목": "합의로 덮으면", "색": TXT_RED, "부제": "치료가 길어지면 대개 깨집니다",
     "항목": ["본인이 직접 신청할 수 있습니다", "산재 미보고가 확인됩니다", "고용 사실까지 함께 드러납니다"],
     "밴드": "두 가지가 함께 커집니다", "밴드색": BAND_RED},
])
footer(d, "산재는 되고, 안 되는 것은 덮는 쪽입니다",
       "회사 돈으로 막다가 형사 문제까지 여는 셈이 됩니다.")
save(im, "외국인근로자-산재보상")

print("\n끝")
