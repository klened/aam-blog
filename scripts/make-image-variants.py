"""좁은 화면용으로 줄인 그림을 만든다.

원본이 966px인데 휴대폰의 343px 자리에 그대로 보내면 그만큼이 낭비된다.
가로 700px을 넘는 그림마다 `이름@480.webp` 를 옆에 만들어 둔다.

    python scripts/make-image-variants.py

Cloudflare 빌드 서버에서 돌리지 않는다. 그쪽은 Node 만 있고 이미지 처리
도구가 없다. 그림을 새로 넣은 뒤 여기서 한 번 돌려 함께 커밋한다.
줄인 파일이 없으면 srcset 이 안 나갈 뿐 화면은 그대로 나온다.
"""

import sys
from pathlib import Path

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

# 글 폴더 안의 그림과 사이트가 늘 쓰는 그림 둘 다 본다.
뿌리목록 = [
    Path(__file__).resolve().parent.parent / "content" / "posts",
    Path(__file__).resolve().parent.parent / "public" / "images",
]
기준폭 = 700   # 이보다 좁은 그림은 줄여도 얻는 게 없다
목표폭 = 480

만듦 = 건너뜀 = 0
for f in sorted(x for 뿌리 in 뿌리목록 for x in 뿌리.rglob("*")):
    if f.suffix.lower() not in (".webp", ".png", ".jpg", ".jpeg"):
        continue
    if "@480" in f.stem:
        continue

    작은것 = f.with_name(f"{f.stem}@480{f.suffix}")
    try:
        im = Image.open(f)
    except Exception as e:  # 열리지 않는 파일은 건드리지 않는다
        print(f"  ! 못 열었습니다 {f.name} — {e}")
        continue

    if im.width <= 기준폭:
        건너뜀 += 1
        continue
    # 원본이 더 새것일 때만 다시 만든다. 매번 전부 다시 만들 이유가 없다.
    if 작은것.exists() and 작은것.stat().st_mtime >= f.stat().st_mtime:
        건너뜀 += 1
        continue

    비율 = 목표폭 / im.width
    작은 = im.convert("RGB").resize((목표폭, round(im.height * 비율)), Image.LANCZOS)
    작은.save(작은것, "WEBP", quality=80, method=6)
    만듦 += 1
    print(f"  {작은것.name}  {작은것.stat().st_size // 1024}KB")

print(f"\n만든 것 {만듦}장 · 건너뛴 것 {건너뜀}장")
