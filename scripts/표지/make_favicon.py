# -*- coding: utf-8 -*-
"""로고에서 심볼만 잘라 파비콘을 만든다.

가로형 로고(361x90)를 그대로 줄이면 「노무법인 도원」 글자가 뭉개져 아무것도
안 보인다. 구글 검색결과의 파비콘은 16px 안팎으로 그려지기 때문이다.
그래서 왼쪽 심볼(79x90)만 잘라 쓴다.

구글은 정사각형이고 48의 배수인 파비콘을 요구한다. 192로 맞춘다.
"""
import sys
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

뿌리 = r"C:/Users/owner/Desktop/★업무/dowon-blog"
원본 = Image.open(f"{뿌리}/public/images/logo.webp").convert("RGBA")

# 심볼과 글자 사이 빈 열이 79~97 이라 79 에서 끊는다.
심볼 = 원본.crop((0, 0, 79, 90))

# 심볼이 상자를 꽉 채우고 있어 그대로 정사각형에 넣으면 답답하다.
# 짧은 변 기준 18% 를 여백으로 둔다.
변 = round(max(심볼.size) * 1.18)
바탕 = Image.new("RGBA", (변, 변), (0, 0, 0, 0))
바탕.paste(심볼, ((변 - 심볼.width) // 2, (변 - 심볼.height) // 2), 심볼)

for 크기, 이름 in [(192, "icon.png"), (180, "apple-icon.png")]:
    바탕.resize((크기, 크기), Image.LANCZOS).save(f"{뿌리}/src/app/{이름}")
    print(f"  src/app/{이름}  {크기}x{크기}")

# 구식 경로를 찾는 크롤러와 브라우저를 위해 ico 도 둔다. 여러 크기를 한 파일에 담는다.
바탕.resize((64, 64), Image.LANCZOS).save(
    f"{뿌리}/src/app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)]
)
print("  src/app/favicon.ico  16·32·48")
