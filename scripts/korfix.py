#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
korfix.py — LLM이 쓴 한국어의 어휘·상투구 검출기

문체검사.mjs 와 역할을 나눈다. 겹치면 같은 지적이 두 번 나와서 아무도 안 읽는다.

    문체검사.mjs   문형   번역 투 구문, 이중 피동, 문장 길이, 문단 리듬
                          근거는 국립국어원 「공공언어 바로 쓰기」 본문
    korfix.py      어휘   LLM이 고르는 낱말과 관용구
                          근거는 초고와 발행본의 차이

그래서 통해·의해·있어서·로부터·되어지·이중피동·정리문구·할수있다·문장길이는
여기 없다. 전부 mjs A/B 층에 이미 있다.

여기서만 보는 것:

    은유       「~할 길이 있습니다」  way 를 「길」로 옮긴 자리
    맺음       「도움이 되었으면」    부탁하지 않은 마무리 인사
    상투구     「게임 체인저」        어디서나 나오는 문구
    띄어쓰기   「세번째 입니다」      서술격 조사를 떼어 쓴 자리

규칙을 넣는 기준은 하나다. content 의 발행본 265편에 돌려서 걸리지 않아야
한다. 발행본은 사람이 고쳐 내보낸 글이라 그 자체가 정답이다. 발행본에서
걸리는 규칙은 초고를 고치는 게 아니라 완성된 글을 흔든다.

처음 만들 때 749건이 나왔고 그중 722건이 오탐이었다. 지운 규칙과 이유는
각 자리에 적어 두었다. 규칙을 새로 넣을 때마다 저장소 뿌리에서 아래를 돌린다.

    python scripts/korfix.py content --quiet

쓰지 않을 말과 고치면 안 되는 말은 docs/금지표현.md 에 「전 → 후」 짝으로
적어 두었다. 규칙을 손보기 전에 그 문서의 2부를 먼저 읽는다.

사용법:
    python scripts/korfix.py 원고.md
    python scripts/korfix.py content              # 폴더째. 아래로 훑는다
    python scripts/korfix.py post.html            # 확장자로 HTML 자동 인식
    cat 원고.txt | python scripts/korfix.py -
    python scripts/korfix.py 원고.md --fix -o 고친글.md
    python scripts/korfix.py 원고.md --json
    python scripts/korfix.py 원고.md --only 은유,맺음
    python scripts/korfix.py content --fail-on 1  # 발행 전 검사
"""

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

# ─────────────────────────────────────────────────────────────
# 규칙 정의
#   pattern : 정규식 (검출)
#   fix     : 치환식. None 이면 자동 치환 불가(사람이 판단)
#   why     : 리포트에 찍히는 제안
#   sev     : high / mid / low
#
# fix 를 다는 기준은 하나다. 앞뒤 문맥을 안 봐도 결과가 같은가.
# 「그것은」을 지우는 것은 문맥을 봐야 한다. 그래서 fix 가 없다.
# ─────────────────────────────────────────────────────────────

@dataclass
class Rule:
    cat: str
    pattern: str
    why: str
    fix: str | None = None
    sev: str = "mid"
    rx: re.Pattern = field(init=False, repr=False)

    def __post_init__(self):
        self.rx = re.compile(self.pattern)


RULES: list[Rule] = [
    # ── 1. 은유 ──────────────────────────────────────────────
    # 「~할 길이 있습니다」가 대표다. 영어 way / path / key / door 를
    # 그대로 옮기면 나온다. 한국어로는 「방법」이거나, 아예 동사로 푼다.
    # 「길이 30cm」를 잡지 않으려고 앞에 오는 어미를 못박아 둔다.
    Rule("은유", r"(할|하는|풀|열|나아갈|살아남을|버틸|이길)\s*길(이|을|은|도)",
         "'방법', '수'로 바꾸거나 동사로 푼다. way 직역", sev="high"),
    Rule("은유", r"[가-힣]{2,}의\s*(열쇠|관문|디딤돌|발판|지름길|첫걸음|민낯|자화상)",
         "은유 명사. 무엇인지 그대로 쓴다", sev="high"),
    # 「문을 열다」 「발목을 잡다」 「숨통이 트이다」는 넣었다가 뺐다.
    # 발행본 265편에 돌리니 5건이 걸렸는데 5건 다 정상이었다. 「문을 연 지
    # 얼마 안 된 회사」는 개업을 말하는 관용구지 번역 투가 아니고, 「전례가
    # 발목을 잡아요」도 이 블로그가 줄곧 쓰는 말이다. 관용구는 은유가 아니다.
    # 잡아야 하는 것은 영어 낱말을 그대로 옮겨 새로 만든 은유다.

    # ── 2. 나열 ──────────────────────────────────────────────
    # 처음에는 「두 번째로」 「세 가지가」 같은 개수 세기를 전부 잡으려 했다.
    # 발행본 265편에 돌리니 305건이 걸렸다. 열어 보니 전부 정상이었다.
    # 이 블로그는 「첫 번째로 ~ 두 번째로 ~ 세 번째는」을 본문 뼈대로 쓴다.
    # 의도한 구조를 도구가 흔들면 안 된다. 그래서 개수 세기는 잡지 않는다.
    # 남긴 것은 개수를 세면서 문장까지 비우는 자리뿐이다.
    Rule("나열", r"다음과\s*같습니다",
         "바로 서술한다", sev="mid"),
    Rule("나열", r"(정리하자면|요약하자면|한마디로\s*말하면)",
         "정리 문구 없이 결론을 쓴다", sev="mid"),
    Rule("나열", r"크게\s*(두|세|네|다섯|\d+)\s*(가지|개|축|갈래)(로|으로)\s*(나눌|나뉩|볼)",
         "개수 예고 삭제하고 바로 소제목으로", sev="mid"),

    # ── 3. 맺음 인사 ─────────────────────────────────────────
    # 부탁한 적 없는 마무리. 산업 글에서는 전부 군더더기다.
    Rule("맺음", r"도움이\s*되(셨|었|시)?(으면|길|기를)\s*(합니다|바랍니다|좋겠)",
         "삭제", sev="high"),
    Rule("맺음", r"궁금한\s*(점|사항)(이|은)\s*(있|언제)",
         "삭제하거나 실제 연락처를 쓴다", sev="mid"),
    Rule("맺음", r"참고하시기\s*바랍니다",
         "삭제", sev="mid"),
    Rule("맺음", r"함께\s*(살펴보|알아보|정리해|짚어보)겠습니다",
         "삭제", sev="high"),
    Rule("맺음", r"오늘은\s*[가-힣\s]{2,20}에\s*대해\s*(알아|살펴)",
         "삭제하고 본론부터", sev="high"),

    # ── 4. AI 상투구 ─────────────────────────────────────────
    Rule("상투구", r"깊이\s*(파고들|들여다보|알아보)", "통째로 삭제", sev="high"),
    Rule("상투구", r"[가-힣]+의\s*세계(로|에)", "통째로 삭제", sev="high"),
    Rule("상투구", r"게임\s*체인저", "무엇이 어떻게 바뀌는지 쓴다", sev="high"),
    Rule("상투구", r"강력한\s*(도구|무기|솔루션)", "무엇이 강력한지 명시", sev="high"),
    Rule("상투구", r"(여정|항해)(을|를|이|가)\s*(시작|떠나)", "통째로 삭제", sev="high"),
    Rule("상투구", r"명심하(세요|시기)", "삭제", sev="mid"),
    # 「회사 혼자가 아닙니다」처럼 정상으로 쓰는 자리가 있다. 위로 문구로
    # 쓸 때만 잡으려고 앞에 오는 말을 못박는다.
    Rule("상투구", r"(당신|여러분|사장님|대표님)[은는]?\s*혼자가\s*아닙니다",
         "삭제", sev="high"),
    Rule("상투구", r"작은\s*것부터\s*시작", "삭제 또는 구체화", sev="mid"),
    Rule("상투구", r"완벽하지\s*않아도\s*(괜찮|됩니다)", "삭제", sev="high"),
    Rule("상투구", r"바로\s*이\s*(지점|대목)", "삭제", sev="mid"),
    Rule("상투구", r"단순히?\s*[가-힣]+가?\s*아닙니다", "무엇인지부터 서술", sev="low"),
    Rule("상투구", r"핵심은\s*다음과\s*같습니다", "삭제하고 바로 서술", sev="mid"),
    Rule("상투구", r"오늘날(의)?\s*(빠르게\s*변화하는|급변하는)", "삭제", sev="high"),
    Rule("상투구", r"[가-힣]+(이|가)\s*(화두|열쇠말|키워드)로\s*떠오르", "삭제", sev="mid"),
    # 「밝혀 두다」는 사실을 드러내 알린다는 뜻이라 부연 설명에 쓰면 과하다.
    # 발행본 265편에 0건이다. 다만 「마지막 항목」 자체는 12건 쓰이는 정상
    # 표현이라 함께 잡으면 안 된다. 잡는 것은 서술어뿐이다.
    # 활용형을 하나씩 적는다. 「밝혀두겠습니다」를 처음에 놓쳤다. 어미를
    # 뭉뚱그려 잡으려다 「습」이 빠졌다. 「밝혀 두 사람」처럼 수를 세는 자리와
    # 섞이지 않도록 뒤에 오는 말을 못박는다.
    Rule("상투구", r"밝혀\s*(둡니다|둔다|두겠|두었|두고|두며|두면|둘)",
         "삭제하고 바로 서술하거나 '중요합니다'처럼 평이하게", sev="mid"),

    # ── 5. 번역투 (mjs 에 없는 것만) ─────────────────────────
    Rule("번역투", r"[가-힣]\s*(을|를)\s*가지고\s*있(습니다|다|어요|음)",
         "'~이 있습니다'로. have 직역", sev="high"),
    # 「둘 중 하나입니다」 「다음 중 하나입니다」는 정상이다. 갈래가 둘이라는
    # 뜻이지 one of the 가 아니다. 앞에 수를 세는 말이 오면 넘긴다.
    Rule("번역투", r"(?<![둘셋넷음])\s중\s*하나(입니다|이다|예요)",
         "'특히 ~합니다'로. one of the 직역", sev="high"),
    Rule("번역투", r"그\s*이상(입니다|이다|의)",
         "'~에 그치지 않습니다'로. more than 직역", sev="high"),
    Rule("번역투", r"[가-힣]는\s*데\s*(에\s*)?도움(이\s*)?(됩니다|된다|되는)",
         "'~해집니다', '~에 유리합니다'로", sev="mid"),
    Rule("번역투", r"당신(의|은|이|을|께서)",
         "주어를 지우거나 구체적 호칭으로. your/you 직역", sev="high"),
    Rule("번역투", r"우리(는|가)\s*(살펴|알아|확인)",
         "we 직역. 주어 삭제", sev="mid"),
    Rule("번역투", r"(다양한|여러|많은|수많은)\s*[가-힣]+들",
         "수식어가 이미 복수 → '들' 중복", sev="high"),
    # 「그것은」과 「~들이」는 뺐다. 발행본에서 각각 56건, 43건이 걸렸는데
    # 「그것은 도산대지급금이에요」처럼 지시 대상이 멀쩡히 있는 자리였다.
    # 더미 주어인지 아닌지는 정규식이 못 가른다. 사람이 볼 일이다.

    # ── 6. 군더더기 ──────────────────────────────────────────
    Rule("군더더기", r"할\s*필요(가|성이)\s*있(습니다|다)",
         "→ '~해야 합니다'", sev="high"),
    # 「가능성이 있으면」 「업무상 필요성이 있는가」는 뺐다. 앞은 평범한
    # 한국어고 뒤는 괴롭힘 판단 기준에 그대로 나오는 말이다.
    Rule("군더더기", r"존재합니다",
         "→ '있습니다'", fix="있습니다", sev="mid"),
    Rule("군더더기", r"[가-힣]\s*(을|를)\s*진행(합니다|했습니다|한다)",
         "해당 동사로 직접. '검토를 진행' → '검토합니다'", sev="mid"),
    Rule("군더더기", r"[가-힣]\s*(을|를)\s*(실시|수행)(합니다|한다|했습니다)",
         "해당 동사로 직접", sev="mid"),
    # 「A는 신고하는 것이고 B는 조사하는 것입니다」처럼 둘을 갈라 설명할 때는
    # 이 꼴이 맞다. 지울 자리인지 아닌지는 사람이 본다. 그래서 low 다.
    Rule("군더더기", r"(하는|되는)\s*것(입니다|이다)",
         "설명이 아니라면 '~합니다'로", sev="low"),
    Rule("군더더기", r"[가-힣]+적(인)?\s*[가-힣]+적",
         "'~적' 중복. 한 문장에 하나만", sev="mid"),
    # 「사실상」은 뺐다. 「사실상 하나의 사업」은 노동위원회가 쓰는 판단
    # 기준이라 지우면 뜻이 달라진다. 31건이 걸렸고 전부 그 용법이었다.
    Rule("군더더기", r"(기본적으로|본질적으로|근본적으로)\s",
         "지워도 뜻이 같다", sev="low"),

    # ── 7. 과잉 시제 ─────────────────────────────────────────
    Rule("과잉시제", r"할\s*것입니다",
         "한국어는 미래를 덜 표시한다 → '합니다'", sev="mid"),
    Rule("과잉시제", r"하고\s*있는\s*(추세|상황|중)(입니다|이다)",
         "'늘고 있습니다'처럼 압축", sev="high"),
    Rule("과잉시제", r"되고\s*있는\s*(추세|상황)",
         "동사 하나로 압축", sev="high"),

    # ── 8. 띄어쓰기 ──────────────────────────────────────────
    # 서술격 조사를 앞말에서 떼는 오류. LLM 이 자주 낸다.
    Rule("띄어쓰기", r"(번째|가지|경우|때문|것|중)\s+(입니다|이다|입니까|이었)",
         "서술격 조사는 앞말에 붙여 쓴다", sev="mid"),
    Rule("띄어쓰기", r"(두|세|네|다섯|여섯|일곱|여덟|아홉|열)번째",
         "'세 번째'로 띄우거나 '3번째'로", sev="low"),
]

SEV_MARK = {"high": "■", "mid": "▲", "low": "·"}

# 본문이 아닌 줄. 원고에는 제목안, 이미지 계획, 표, 발행 전 확인이 섞여 있다.
# 그것까지 세면 경고가 본문보다 많아진다. 문체검사.mjs 에서 가져왔다.
SKIP_LINE = re.compile(
    r"^\s*$"
    r"|^[■□▶·※]"
    r"|^\s*→"
    r"|^\["
    r"|^={3,}|^─{3,}|^-{3,}"
    r"|[┌│└├┬┼┤┐┘]"
    r"|^https?://"
    r"|^📞|^✉"
    r"|^\d+\)\s"
)


# ─────────────────────────────────────────────────────────────
# 전처리
#   지우지 않고 같은 길이의 공백으로 덮는다. 줄바꿈은 남긴다.
#   줄바꿈까지 공백으로 만들면 줄이 합쳐져서 보고 줄번호가 밀린다.
# ─────────────────────────────────────────────────────────────

def _blank(m: re.Match) -> str:
    return re.sub(r"[^\n]", " ", m.group(0))


def strip_html(text: str) -> str:
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", _blank, text, flags=re.S | re.I)
    text = re.sub(r"<!--.*?-->", _blank, text, flags=re.S)
    text = re.sub(r"<[^>]+>", _blank, text)
    return text


def strip_markdown(text: str) -> str:
    """머리말, 코드, 그림, 링크 주소를 덮는다. 링크의 글자는 남긴다."""
    text = re.sub(r"\A---\n.*?\n---\n", _blank, text, flags=re.S)   # 머리말
    text = re.sub(r"```.*?```", _blank, text, flags=re.S)            # 코드 블록
    text = re.sub(r"`[^`\n]*`", _blank, text)                       # 인라인 코드
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", _blank, text)            # 그림
    text = re.sub(r"(?<=\])\([^)]*\)", _blank, text)                # 링크 주소만
    # 강조 기호는 낱말 사이에 끼어 규칙을 끊는다. 이 블로그는 「성공의
    # **열쇠**」처럼 낱말 하나만 굵게 쓰는 일이 잦아서 안 지우면 놓친다.
    #
    # 여기만 공백으로 덮지 않고 지운다. 덮었더니 「것**입니다**」가
    # 「것  입니다」가 되어 띄어쓰기 오탐이 38건 생겼다. 마크다운에서
    # ** 는 화면에 안 보이므로 공백이 아니라 없는 것으로 봐야 맞다.
    # 대신 지운 만큼 그 줄의 열 번호가 앞으로 당겨진다. 줄 번호는 그대로다.
    text = re.sub(r"\*\*|__|~~|\*", "", text)
    return text


def strip_skipped(text: str) -> str:
    out = []
    for line in text.split("\n"):
        out.append(" " * len(line) if SKIP_LINE.search(line) else line)
    return "\n".join(out)


def preprocess(raw: str, mode: str) -> str:
    if mode == "html":
        raw = strip_html(raw)
    elif mode == "md":
        raw = strip_markdown(raw)
    return strip_skipped(raw)


def guess_mode(path: str, forced: str | None) -> str:
    if forced:
        return forced
    ext = Path(path).suffix.lower()
    if ext in (".html", ".htm"):
        return "html"
    if ext in (".md", ".mdx"):
        return "md"
    return "txt"


# ─────────────────────────────────────────────────────────────
# 검사
# ─────────────────────────────────────────────────────────────

def check(text: str, cats: set[str] | None) -> list[dict]:
    hits = []
    for i, line in enumerate(text.split("\n"), 1):
        for rule in RULES:
            if cats and rule.cat not in cats:
                continue
            for m in rule.rx.finditer(line):
                hits.append({
                    "line": i, "col": m.start() + 1,
                    "cat": rule.cat, "sev": rule.sev,
                    "match": m.group(0).strip(),
                    "why": rule.why,
                    "context": line.strip()[:90],
                })
    hits.sort(key=lambda h: (h["line"], h["col"]))
    return hits


def autofix(text: str, cats: set[str] | None) -> tuple[str, int]:
    """앞뒤 문맥을 안 봐도 결과가 같은 규칙만 돌린다. 지금은 두 개뿐이다."""
    n = 0
    for rule in RULES:
        if rule.fix is None or (cats and rule.cat not in cats):
            continue
        text, c = rule.rx.subn(rule.fix, text)
        n += c
    # 띄어쓰기는 규칙 표가 아니라 여기서 처리한다. 잡은 자리와 고치는 자리가 다르다.
    if not cats or "띄어쓰기" in cats:
        text, c = re.subn(r"(번째|가지|경우|때문|것|중)\s+(입니다|이다|입니까)", r"\1\2", text)
        n += c
    return text, n


# ─────────────────────────────────────────────────────────────
# 리포트
# ─────────────────────────────────────────────────────────────

def report(hits: list[dict], name: str, total_chars: int) -> None:
    if not hits:
        print(f"OK  {name}: 검출 없음")
        return

    print(f"\n{'='*66}\n{name}  —  {len(hits)}건 / {total_chars:,}자\n{'='*66}")
    by_cat: dict[str, list[dict]] = {}
    for h in hits:
        by_cat.setdefault(h["cat"], []).append(h)

    for cat, items in by_cat.items():
        print(f"\n[{cat}]  {len(items)}건")
        for h in items:
            print(f"  {SEV_MARK[h['sev']]} L{h['line']}:{h['col']}  "
                  f"「{h['match']}」  → {h['why']}")
            print(f"      {h['context']}")

    print(f"\n{'-'*66}")
    print("  " + " | ".join(f"{k} {len(v)}" for k, v in sorted(by_cat.items())))
    high = sum(1 for h in hits if h["sev"] == "high")
    density = len(hits) / max(total_chars, 1) * 1000
    print(f"  우선수정(■) {high}건 · 밀도 {density:.1f}건/1000자")
    if density > 6:
        print("  판정: 상투구 농도 높음. 문단 단위 재작성 권장")
    elif density > 2:
        print("  판정: 부분 수정 필요")
    else:
        print("  판정: 양호")


def collect(paths: list[str]) -> list[Path]:
    out = []
    for p in paths:
        q = Path(p)
        if q.is_dir():
            out += sorted(x for x in q.rglob("*")
                          if x.suffix.lower() in (".md", ".mdx", ".txt", ".html", ".htm"))
        else:
            out.append(q)
    return out


# ─────────────────────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser(description="LLM 한국어 어휘·상투구 검출기")
    ap.add_argument("path", nargs="+", help="파일 또는 폴더 ('-' 는 표준입력)")
    ap.add_argument("--html", action="store_const", const="html", dest="mode",
                    help="HTML 로 강제")
    ap.add_argument("--md", action="store_const", const="md", dest="mode",
                    help="마크다운으로 강제")
    ap.add_argument("--fix", action="store_true", help="문맥 없이 안전한 규칙만 치환")
    ap.add_argument("-o", "--out", help="--fix 결과 저장 경로")
    ap.add_argument("--json", action="store_true", help="JSON 출력")
    ap.add_argument("--only", help="카테고리 필터 (쉼표 구분)")
    ap.add_argument("--quiet", action="store_true", help="검출된 파일만 출력")
    ap.add_argument("--fail-on", type=int, default=None,
                    help="검출 N건 이상이면 exit 1")
    a = ap.parse_args()

    cats = set(a.only.split(",")) if a.only else None

    # --fix 는 원문을 그대로 고쳐야 하므로 전처리한 본문을 쓰지 않는다.
    if a.fix:
        if a.path == ["-"]:
            raw = sys.stdin.read()
        else:
            raw = Path(a.path[0]).read_text(encoding="utf-8-sig")
        fixed, n = autofix(raw, cats)
        if a.out:
            Path(a.out).write_text(fixed, encoding="utf-8")
            print(f"치환 {n}건 → {a.out}", file=sys.stderr)
        else:
            sys.stdout.write(fixed)
        return 0

    if a.path == ["-"]:
        targets = [("<stdin>", sys.stdin.read(), guess_mode("", a.mode))]
    else:
        targets = [(f.name, f.read_text(encoding="utf-8-sig"),
                    guess_mode(str(f), a.mode)) for f in collect(a.path)]

    all_hits, results = [], []
    for name, raw, mode in targets:
        body = preprocess(raw, mode)
        hits = check(body, cats)
        all_hits += hits
        results.append((name, raw, hits))

    if a.json:
        print(json.dumps(
            {"files": [{"file": n, "count": len(h), "hits": h} for n, _, h in results],
             "total": len(all_hits)},
            ensure_ascii=False, indent=2))
    else:
        for name, raw, hits in results:
            if a.quiet and not hits:
                continue
            report(hits, name, len(raw))
        if len(results) > 1:
            hit_files = sum(1 for _, _, h in results if h)
            print(f"\n{'='*66}")
            print(f"  파일 {len(results)}개 중 {hit_files}개에서 {len(all_hits)}건")

    if a.fail_on is not None and len(all_hits) >= a.fail_on:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
