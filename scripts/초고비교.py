#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
초고비교.py — 고치기 전과 고친 뒤를 대 놓고 실제로 지운 말을 캔다.

korfix.py 의 규칙을 머리로 짜다가 265편 중 242편을 걸었다. 722건이 오탐이었다.
머리로 짜면 안 된다는 뜻이다. 그래서 여기서는 짜지 않고 캔다.

    캐는 자리 두 곳

    git    이 저장소의 커밋 이력. 파일이 처음 들어온 판과 지금 판을 비교한다.
           다만 첫 판이 이미 사람이 고쳐 놓은 글이라 번역 투 교정은 거의
           안 잡힌다. 2026-08-09 에 265편을 돌려 확인했다. 자세한 것은
           초고/읽어주세요.md 에 있다.
    초고    초고/X.md 와 content/**/X.md 를 비교한다. 이쪽이 정확하다.
           초고 폴더는 Claude 가 낸 그대로이기 때문이다.

    쓰는 법 (어느 폴더에서 돌려도 된다. 경로는 스스로 찾는다)

    python scripts/초고비교.py --git                # 커밋 이력에서 캔다
    python scripts/초고비교.py --초고                # 초고 폴더에서 캔다
    python scripts/초고비교.py --git --pairs 40     # 고친 문장 짝을 40개 본다
    python scripts/초고비교.py --git --json > 결과.json

    읽는 법

    「지운 말」 표에서 위쪽에 오래 남아 있는 것이 곧 규칙 후보다.
    여러 편에서 반복해서 지웠다면 그것은 취향이 아니라 버릇이다.
    편수가 1~2편이면 그때그때 고친 것이니 규칙으로 만들지 않는다.
"""

import argparse
import collections
import difflib
import json
import re
import subprocess
import sys
from pathlib import Path

BLOG = Path(__file__).resolve().parent.parent   # scripts/ 의 부모가 저장소 뿌리
CONTENT = BLOG / "content"
DRAFT = BLOG / "초고"

# 규칙 후보로 올리는 최소 편수. 1~2편은 그날의 판단이지 버릇이 아니다.
MIN_FILES = 3


# ── 본문만 남기기 ────────────────────────────────────────────
def body(text: str) -> str:
    text = re.sub(r"\A---\n.*?\n---\n", "", text, flags=re.S)      # 머리말
    text = re.sub(r"```.*?```", "", text, flags=re.S)              # 코드
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", text)               # 그림
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)           # 링크
    text = re.sub(r"^\s*\|.*\|\s*$", "", text, flags=re.M)         # 표
    text = re.sub(r"[*_`>#]", "", text)                            # 강조·제목 기호
    return text


def sentences(text: str) -> list[str]:
    out = []
    for line in body(text).split("\n"):
        line = line.strip()
        if not line or line.startswith(("-", "=")):
            continue
        for s in re.split(r"(?<=다\.)\s*|(?<=요\.)\s*|(?<=[.!?])\s+", line):
            s = s.strip()
            if len(s) >= 8:
                out.append(s)
    return out


def 어절(s: str) -> list[str]:
    return [w for w in re.split(r"\s+", re.sub(r"[^\w\s가-힣]", " ", s)) if w]


# ── 짝 만들기 ────────────────────────────────────────────────
def pair_up(before: list[str], after: list[str]) -> list[tuple[str, str]]:
    """문장 목록 둘을 견주어 「고친 자리」만 뽑는다. 통째로 새로 쓴 것은 뺀다."""
    pairs = []
    sm = difflib.SequenceMatcher(None, before, after, autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            continue
        b_chunk, a_chunk = before[i1:i2], after[j1:j2]
        if tag == "delete":
            pairs += [(b, "") for b in b_chunk]
            continue
        if tag == "insert":
            continue
        # replace — 비슷한 것끼리 다시 붙인다
        for b in b_chunk:
            best, score = "", 0.0
            for a in a_chunk:
                r = difflib.SequenceMatcher(None, b, a).ratio()
                if r > score:
                    best, score = a, r
            # 0.45 아래면 같은 문장을 고친 게 아니라 다른 문장으로 갈아 끼운 것이다
            pairs.append((b, best if score >= 0.45 else ""))
    return pairs


def 어미만_바뀐_짝(b: str, a: str) -> bool:
    """맨 끝 어절만 다르면 어미 교체다.

    이 블로그는 본문을 합쇼체로 쓰고 「노무사 한마디」 「마지막으로 짚을 것」
    두 구간만 해요체로 쓴다. 2026-08-06 커밋에서 그 구간을 바꾸면서 어미
    교체가 3930건 생겼다. 문체를 정한 것이지 번역 투를 고친 게 아니다.
    본문 전체가 해요체로 넘어간 것이 아니므로 지금도 265편 중 262편이
    합쇼체 우세다. 이 짝은 캐는 대상이 아니다."""
    bw, aw = 어절(b), 어절(a)
    return bool(bw) and bool(aw) and bw[:-1] == aw[:-1]


def mine(pairs: list[tuple[str, str]], fname: str, removed, examples) -> None:
    """고친 짝에서 「빠진 어절 뭉치」를 캔다.

    맨 끝 어절은 빼고 센다. 종결어미가 거기 붙어 있어서 넣어 두면
    「있습니다」 「합니다」가 표를 다 차지한다."""
    for b, a in pairs:
        if not a or 어미만_바뀐_짝(b, a):
            continue
        bw, aw = 어절(b)[:-1], 어절(a)
        aset = set(aw)
        for n in (1, 2, 3):
            for i in range(len(bw) - n + 1):
                gram = bw[i:i + n]
                if any(w in aset for w in gram):
                    continue
                key = " ".join(gram)
                if len(key) < 2 or key.isdigit():
                    continue
                removed[key].add(fname)
                if len(examples[key]) < 3:
                    examples[key].append((b[:76], a[:76]))


# ── 캐는 자리 ────────────────────────────────────────────────
def git_versions() -> list[tuple[str, str, str]]:
    # core.quotepath 를 끄지 않으면 한글 파일명이 "content/1\353\205\204..."
    # 꼴로 돌아온다. 그러면 .md 로 끝나지 않아 265편이 0편이 된다.
    def run(args):
        return subprocess.run(["git", "-c", "core.quotepath=false"] + args,
                              cwd=BLOG, capture_output=True,
                              text=True, encoding="utf-8", errors="replace").stdout

    files = [f for f in run(["ls-files", "content"]).split("\n")
             if f.endswith((".md", ".mdx"))]
    out = []
    for f in files:
        shas = [s for s in run(["log", "--format=%H", "--reverse", "--", f]).split("\n") if s]
        if len(shas) < 2:
            continue
        first = run(["show", f"{shas[0]}:{f}"])
        now = (BLOG / f).read_text(encoding="utf-8-sig") if (BLOG / f).exists() else run(["show", f"{shas[-1]}:{f}"])
        if first and now and first != now:
            out.append((Path(f).name, first, now))
    return out


def draft_versions() -> list[tuple[str, str, str]]:
    """발행본은 content/posts/<슬러그>/<슬러그>.md 로 한 겹 더 들어가 있다.
    초고는 이름만 맞추면 되도록 아래에서 찾아 준다."""
    if not DRAFT.exists():
        return []
    final_by_name = {f.name: f for f in CONTENT.rglob("*.md")}
    out, 짝없음 = [], []
    for d in sorted(DRAFT.rglob("*.md")):
        if d.name == "읽어주세요.md":
            continue
        final = final_by_name.get(d.name)
        if final is None:
            짝없음.append(d.name)
            continue
        b = d.read_text(encoding="utf-8-sig")
        a = final.read_text(encoding="utf-8-sig")
        if b != a:
            out.append((d.name, b, a))
    for n in 짝없음:
        print(f"발행본을 못 찾았다: 초고/{n}", file=sys.stderr)
    return out


# ── 보고 ─────────────────────────────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser(description="초고와 발행본의 차이를 캔다")
    ap.add_argument("--git", action="store_true", help="커밋 이력에서 캔다")
    ap.add_argument("--초고", dest="draft", action="store_true", help="초고 폴더에서 캔다")
    ap.add_argument("--pairs", type=int, default=0, help="고친 문장 짝을 N개 보여 준다")
    ap.add_argument("--top", type=int, default=40, help="지운 말 상위 N개")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    if not a.git and not a.draft:
        ap.error("--git 또는 --초고 중 하나를 고른다")

    versions = (git_versions() if a.git else []) + (draft_versions() if a.draft else [])
    if not versions:
        print("비교할 짝이 없다.", file=sys.stderr)
        return 2

    removed = collections.defaultdict(set)
    examples = collections.defaultdict(list)
    all_pairs, 통삭제, 어미교체 = [], collections.defaultdict(set), 0
    for fname, before, after in versions:
        p = pair_up(sentences(before), sentences(after))
        for b, x in p:
            if not b:
                continue
            if not x:
                통삭제[b.strip()].add(fname)
            elif 어미만_바뀐_짝(b, x):
                어미교체 += 1
            else:
                all_pairs.append((fname, b, x))
        mine(p, fname, removed, examples)

    ranked = sorted(((k, len(v)) for k, v in removed.items() if len(v) >= MIN_FILES),
                    key=lambda x: -x[1])

    if a.json:
        print(json.dumps({
            "files": len(versions), "pairs": len(all_pairs),
            "candidates": [{"말": k, "편수": n, "보기": examples[k]} for k, n in ranked],
        }, ensure_ascii=False, indent=2))
        return 0

    보일러 = sorted(((k, len(v)) for k, v in 통삭제.items() if len(v) >= 10),
                   key=lambda x: -x[1])
    print(f"\n비교한 글 {len(versions)}편")
    print(f"  고쳐 쓴 문장 {len(all_pairs)}개   ← 여기서 캔다")
    print(f"  어미만 바꾼 문장 {어미교체}개   (합쇼체→해요체. 제외)")
    print(f"  통째로 지운 문장 {sum(len(v) for v in 통삭제.values())}개")
    print(f"{len(ranked)}개 말이 {MIN_FILES}편 이상에서 지워졌다\n")
    print("=" * 74)
    print(f"{'편수':>4}  지운 말")
    print("=" * 74)
    for k, n in ranked[:a.top]:
        print(f"{n:>4}  「{k}」")
        b, x = examples[k][0]
        print(f"      전 {b}")
        print(f"      후 {x if x else '(문장째 삭제)'}")

    if 보일러:
        print("\n" + "=" * 74)
        print("10편 이상에서 통째로 지운 문장 (대개 템플릿 덩어리다)")
        print("=" * 74)
        for k, n in 보일러[:12]:
            print(f"{n:>4}  {k[:66]}")

    if a.pairs:
        print("\n" + "=" * 74)
        print("고친 문장 짝")
        print("=" * 74)
        for fname, b, x in all_pairs[:a.pairs]:
            print(f"\n[{fname}]")
            print(f"  전 {b[:88]}")
            print(f"  후 {x[:88] if x else '(삭제)'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
