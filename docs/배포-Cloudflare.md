# Cloudflare 배포

2026-07-31에 Netlify에서 옮겼습니다. 옮긴 이유는 하나입니다.
Netlify 무료 플랜의 크레딧이 글 5편 단계에서 이미 바닥나 실제 사이트 배포가 막혔고,
앞으로 1,000편을 옮기면서 수정할 때마다 같은 일이 반복되기 때문입니다.

Cloudflare는 **대역폭이 무제한**이고 상업적 이용을 명시적으로 허용합니다.
글이 늘고 검색 유입이 붙어도 요금이 발생하지 않습니다.

## 한도와 현재 규모

실제 빌드 결과로 계산한 값입니다.

| 항목 | Cloudflare 한도 | 1,000편일 때 예상 |
| --- | --- | --- |
| 파일 수 | 20,000개 | 약 4,400개 |
| 파일 하나 크기 | 25MB | 최대 200KB (이미지) |
| 전체 용량 | 제한 없음 | 약 540MB |
| 빌드 | 월 500회 | 하루 3회 기준 월 90회 |
| 대역폭 | 무제한 | — |

글 한 편이 파일 4개(html 1 + 이미지 3)를 만듭니다. 이미지를 편당 6장까지 늘려도
1,000편에서 7,000개 수준이라 여유가 있습니다.

## 대시보드 설정값

Cloudflare의 새 방식은 Pages가 아니라 **Workers**로 배포합니다.
저장소에 `wrangler.jsonc`가 있어 대부분 자동으로 잡힙니다.

| 항목 | 값 |
| --- | --- |
| Project name | `dowon-blog` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| **Non-production branch deploy command** | **`npx wrangler versions upload`** |
| Builds for non-production branches | 체크 |

### 검토용 브랜치 명령을 반드시 바꿔야 합니다

Cloudflare가 기본으로 넣어주는 값은 두 칸 모두 `npx wrangler deploy` 입니다.
**이대로 두면 검토용 브랜치를 빌드할 때마다 실제 사이트가 덮어써집니다.**

2026-07-31에 실제로 겪었습니다. review 브랜치를 푸시했더니 그 빌드가
실제 사이트 트래픽 100%를 가져갔고, 검수 중인 초안 5편이 그대로 공개되면서
페이지 전체에 `noindex`가 걸렸습니다. 도메인을 옮기기 전이라 외부 노출은 없었습니다.

| 명령 | 하는 일 |
| --- | --- |
| `wrangler deploy` | 버전을 올리고 **바로 서비스에 반영**합니다 |
| `wrangler versions upload` | 버전만 올리고 **서비스는 건드리지 않습니다** |

검토용 브랜치는 뒤엣것을 써야 미리보기 주소만 생기고 실제 사이트는 그대로 있습니다.

**Project name은 `wrangler.jsonc`의 `name` 과 같아야 합니다.** 다르면 배포될 때
프로젝트가 하나 더 생깁니다.

`npx wrangler deploy`가 [wrangler.jsonc](../wrangler.jsonc)를 읽어 `out/` 폴더를 올립니다.
코드가 도는 Worker가 아니라 정적 파일만 올리는 형태라 진입점(`main`)이 없습니다.
정적 파일 요청은 Worker 실행으로 치지 않아 무료 요청 한도를 쓰지 않습니다.

## 인기글 순위를 위한 토큰 하나

글 아래 「지금 인기있는 글」은 Cloudflare가 모은 방문 수로 만듭니다.
정적 사이트라 화면을 그릴 때는 그 숫자를 읽을 수 없어, **빌드하는 순간에
한 번 불러와** 파일로 남기고 그 파일을 읽습니다. 배포할 때마다 갱신됩니다.

### 토큰 만들기

My Profile → API Tokens → Create Token → Custom token

| 칸 | 값 |
| --- | --- |
| Permissions | `Account` · `Account Analytics` · `Read` — **한 줄만** |
| Account Resources | `Include` · 도원 계정 (All accounts 말고) |
| Client IP Filtering | **비웁니다.** 빌드 서버 IP가 매번 달라 채우면 막힙니다 |
| TTL | 비우면 만료 없음. 정하면 그날부터 순위 갱신이 조용히 멈춥니다 |

### 어디에 넣나

**Runtime 쪽 「Variables and secrets」가 아닙니다.** 거기는 실행 중에 쓰는
변수라 정적 파일만 올리는 이 프로젝트에서는 「Variables cannot be added to a
Worker that only has static assets」라고 막힙니다.

Settings 페이지를 아래로 내려 **Build** 아래, `API token` 줄 바로 다음의
「Variables and secrets」에 넣습니다.

| 이름 | 값 | 종류 |
| --- | --- | --- |
| `CF_API_TOKEN` | 만든 토큰 | Secret(암호화) |

계정 ID는 토큰으로 찾아 쓰므로 넣지 않아도 됩니다. 검토용에도 순위를
붙이려면 Preview 쪽에도 같은 값을 넣습니다.

**넣은 뒤 한 번 다시 배포해야 적용됩니다.** 저장만으로는 빌드가 돌지 않습니다.

### 값 두 개가 헷갈립니다

Web Analytics 에는 비슷하게 생긴 값이 둘 있고 **서로 다릅니다.**

| 값 | 어디에 쓰나 | 어디서 보나 |
| --- | --- | --- |
| beacon 토큰 | 글에 심는 JS 조각 | JS Snippet 화면 |
| **사이트 태그** | **통계를 읽는 질의** | Manage site 주소 끝 `.../web-analytics/edit/<이 값>` |

처음에 beacon 토큰을 넣었더니 **오류 없이 0개**가 돌아왔습니다. 방문이
없는 것인지 값이 틀린 것인지 로그만으로는 구분되지 않았습니다. 대시보드에
조회 142회가 찍혀 있어 값이 틀린 쪽임을 알았습니다.

사이트를 다시 만들면 이 값이 바뀝니다. 그때는 `CF_SITE_TAG` 로 덮거나
스크립트의 기본값을 고칩니다.

### 안 되면 어떻게 되나

빌드를 멈추지 않습니다. 통계를 못 읽은 것보다 배포가 막히는 편이 훨씬
나쁩니다. 그때는 글 아래에 같은 주제의 글이 나가고 제목도 「함께 읽으면
좋은 글」로 남습니다. 실패해도 기존 순위 파일을 건드리지 않아, 일시적인
오류 한 번에 있던 순위가 지워지지 않습니다.

빌드 로그에서 `[인기글]` 로 시작하는 줄을 보면 상태를 알 수 있습니다.

```
[인기글] 상위 10편을 적었습니다.        ← 정상
[인기글] CF_API_TOKEN 이 없어 건너뜁니다.  ← 토큰 미설정
[인기글] 불러오지 못했습니다 — ...        ← 권한이나 질의 문제
```

로컬에서 미리 확인하려면 `.env` 에 `CF_API_TOKEN` 을 적고 `npm run popular`
를 돌립니다. `.env` 는 저장소에 올라가지 않습니다.

## 환경변수는 넣지 않아도 됩니다

호스팅을 옮길 때 대시보드 설정을 빠뜨려 사고가 나는 일이 잦아, 두 값 모두
설정 없이 동작하도록 코드에 넣었습니다.

| 값 | 어떻게 정해지나 |
| --- | --- |
| 사이트 주소 | [site.ts](../src/config/site.ts)의 기본값이 `https://blog.dowonhr.com` 입니다 |
| 초안 노출·색인 차단 | [drafts.ts](../src/lib/drafts.ts)가 **빌드 중인 브랜치 이름**을 보고 정합니다 |

`main` 브랜치면 발행된 글만 나오고 검색 색인을 허용합니다.
그 외 브랜치는 검수·초안까지 보여주고 `noindex`를 붙입니다.

Netlify는 브랜치 배포에 색인 차단을 자동으로 걸어줬지만 **Cloudflare는 걸어주지 않습니다.**
그래서 호스팅에 기대지 않고 코드에서 직접 판단하게 했습니다.

실제로 확인한 결과입니다.

| 브랜치 | robots | 글 수 |
| --- | --- | --- |
| `main` | `index, follow` | 발행된 글만 |
| `review` | `noindex, nofollow` | 검수·초안 포함 |

## 헤더와 리다이렉트

`public/_headers` 와 `public/_redirects` 두 파일로 관리합니다.
Cloudflare와 Netlify가 **같은 문법으로** 읽으므로 한 벌만 두면 됩니다.
`netlify.toml`에 있던 헤더 설정은 이 파일들로 옮겼습니다.

## 주소

2026-07-31 배포 완료. 계정 하위 도메인은 `choim-249` 입니다.

| 용도 | 주소 |
| --- | --- |
| 실제 사이트 (main) | `https://dowon-blog.choim-249.workers.dev` |
| 검토용 (main 아닌 브랜치) | `https://<브랜치>-dowon-blog.choim-249.workers.dev` |

검토용 주소는 **브랜치에 푸시가 일어나야 처음 생깁니다.** Git 연동을 붙인 시점보다
앞서 푸시한 내용은 빌드되지 않으므로, 연동 직후에는 검토용 주소가 404입니다.

### 배포 직후 확인한 것

| 항목 | 결과 |
| --- | --- |
| `/` → `/blog/` 이동 | 301 |
| `/blog/`, 사이트맵, RSS | 200 |
| 없는 주소 | 404 (200을 내면 검색엔진이 없는 글을 정상 페이지로 오해합니다) |
| 보안 헤더 | `_headers` 적용 확인 |
| 정적 자산 캐시 | `max-age=31536000, immutable` |
| canonical·사이트맵 주소 | `https://blog.dowonhr.com` |
| robots (main) | `index, follow` |

## 도메인 연결

`blog.dowonhr.com`은 아임웹 DNS에서 관리합니다.
도메인 전체를 Cloudflare로 옮기지 않고 **CNAME 한 줄만 바꿉니다.**

1. Workers 프로젝트 → Domains → Custom Domains and Routes 에서 `blog.dowonhr.com` 추가
2. 아임웹 관리자 → 설정 → 도메인 → DNS 레코드에서 `blog` CNAME 값을
   기존 Netlify 주소에서 `dowon-blog.choim-249.workers.dev` 로 변경
3. 인증서가 자동 발급될 때까지 몇 분에서 한 시간 정도 걸립니다

**MX 레코드는 절대 건드리지 않습니다.** 회사 메일이 끊깁니다.
`dowonhr.com` 본체와 `/52/` 게시판도 영향을 받지 않습니다. `blog` 서브도메인만 바뀝니다.

## Netlify 정리 기록

2026-08-06에 정리를 마쳤습니다. 남겨 두었던 Netlify 사이트가 push마다 같이 빌드되면서
무료 크레딧(월 300)을 소진하는 것이 확인되어 — 7월 주기를 다 썼고 8월 주기도 하루 만에
75%를 썼습니다 — Netlify 사이트를 삭제하고 `netlify.toml`과 `.env`의
`NETLIFY_AUTH_TOKEN`을 함께 지웠습니다. 지금은 Cloudflare만 씁니다.
