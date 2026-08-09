# 3D프린팅 인사이트 — 더블에이엠 자체 블로그

마크다운 파일로 글을 쓰면 Next.js가 정적 HTML로 만들어 Cloudflare에 올리는 구조입니다.
노무법인 도원 블로그(blog.dowonhr.com)와 같은 코드베이스를 더블에이엠(aamkorea.co.kr)
브랜딩으로 옮긴 것입니다.

```
content/posts/글.md  →  빌드 시점에 읽음  →  정적 HTML 생성  →  Cloudflare 배포
```

- 운영 주소: https://blog.aamkorea.co.kr/blog/
- 원본 홈페이지: https://aamkorea.co.kr (아임웹, 그대로 유지)

---

## 1. 글 쓰는 방법

### 1-1. 새 글 만들기

`content/_템플릿.md`를 복사해서 `content/posts/` 안에 새 이름으로 저장합니다.

```
content/posts/sla-프린터-처음-고를-때.md
```

맨 위 `---` 사이가 속성이고 그 아래가 본문입니다. 작성 규칙은 [docs/markdown-guide.md](docs/markdown-guide.md)를 참고합니다.

핵심만 옮기면 이렇습니다.

- 제목은 32자 이내로 쓰고 파이프(`|`) 나열과 광고 문구를 넣지 않습니다.
- 첫 문단은 인사말이 아니라 결론으로 시작합니다. 이 문장이 검색결과 설명문이 됩니다.
- 본문의 `#`이 h2가 됩니다. 섹션은 3개 이상 만듭니다.
- `# 자주 묻는 질문` 아래에 `##`로 질문을 쓰면 FAQ 구조화 데이터가 자동 생성됩니다.
- `상태: 발행`이고 `노출: true`인 글만 사이트에 나갑니다.

### 1-2. 발행 전 점검

```bash
npm run seo:check -- 초안
```

### 1-3. 발행

`상태: 초안`을 `상태: 발행`으로 바꾸고 커밋·푸시하면 Cloudflare가 자동으로 다시 빌드해 배포합니다.

---

## 2. 처음 한 번만 하는 설정

1. **GitHub** — 새 저장소를 만들고 이 폴더를 푸시합니다.
2. **Cloudflare** — 대시보드 → Workers & Pages → 저장소 연결.
   빌드 명령 `npm run build`, 배포는 `npx wrangler deploy`(wrangler.jsonc가 out/을 올립니다).
3. **도메인** — aamkorea.co.kr DNS(호스트코코아)에 CNAME 한 줄을 추가합니다.
   `blog` → `<프로젝트>.pages.dev` (또는 Cloudflare가 안내하는 대상)
4. **사이트 주소** — 기본값이 `https://blog.aamkorea.co.kr`로 코드에 들어 있어
   (src/config/site.ts) 따로 설정할 것이 없습니다. 도메인이 달라지면 환경변수
   `NEXT_PUBLIC_SITE_URL`로 덮어씁니다.

## 3. 회사 정보와 CTA

`src/config/site.ts` 한 파일만 고치면 전체 글에 반영됩니다.

- `ORG` / `SITE` : 회사·사이트 이름, 주소, 설명
- `CTA_PRESETS` : 글 하단 전환 문구 — 견적문의(/request), 소재추천(/recommend), 기술자료(/download)로 연결
- `TOOLS` : 글 옆에 붙는 홈페이지 도구 링크
- `COLORS` + `src/app/globals.css`의 `:root` : 브랜드 색 (로고 시안 블루)
- `VERIFY` / `ANALYTICS` : 서치콘솔·애널리틱스 값. **아직 비어 있습니다.** 등록 후 채웁니다.

글쓴이는 `src/config/members.ts`에 있습니다. 지금은 '더블에이엠 기술팀' 명의 하나이고,
실명 엔지니어가 참여하면 여기에 추가합니다.

---

## 4. 검색엔진 등록 (배포 후)

| 도구 | 등록 내용 |
|---|---|
| 구글 서치콘솔 | 사이트 + 사이트맵 `/blog/sitemap.xml` |
| 네이버 서치어드바이저 | 사이트 + 사이트맵 |
| 빙 웹마스터도구 | 사이트 + 사이트맵 (챗GPT 검색이 빙 색인을 씁니다) |

등록하면서 받은 확인 값을 `src/config/site.ts`의 `VERIFY`에 넣고 다시 배포합니다.
아임웹 쪽 `robots.txt`(도메인 루트)에도 한 줄 추가합니다.

```
Sitemap: https://blog.aamkorea.co.kr/blog/sitemap.xml
```

---

## 5. 로컬에서 미리 보기

```bash
npm run dev          # http://localhost:3000/blog
npm run build        # out/ 폴더에 정적 파일 생성
npm run seo:check    # 발행 전 점검
```

글이 하나도 없을 때 화면만 보려면 샘플 모드를 씁니다. (샘플 글은 도원 시절
노무 예제라 내용은 무시하고 배치만 봅니다.)

```bash
npm run dev:sample
```

---

## 6. 폴더 구조

```
content/
├── _템플릿.md                  새 글 복사용 (빌드에 포함되지 않음)
└── posts/                      실제 글이 놓이는 곳

src/
├── app/                        레이아웃·목록·상세·sitemap·rss
├── components/                 목차·작성자·CTA·관련글·구조화데이터
├── lib/                        마크다운 읽기, SEO, 슬러그
└── config/
    ├── site.ts                 회사 정보·카테고리·CTA·색상
    └── members.ts              글쓴이 명부
```
