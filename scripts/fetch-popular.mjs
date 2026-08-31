#!/usr/bin/env node
/**
 * 빌드할 때 Cloudflare 방문 기록을 불러와 조회수 상위 글을 적어 둔다.
 *
 * 정적 사이트라 화면을 그릴 때는 조회 기록을 읽을 수 없다. 그래서 빌드하는
 * 순간에 한 번 불러와 파일로 남기고, 그 파일을 읽어 글 아래 「지금 인기있는
 * 글」을 만든다. 배포할 때마다 갱신된다.
 *
 *   npm run build      (prebuild 로 자동 실행)
 *   npm run popular    (따로 돌려 보고 싶을 때)
 *
 * 필요한 환경변수는 하나다. Cloudflare 대시보드의
 * 「Workers & Pages → 프로젝트 → Settings → Variables and Secrets」에 넣는다.
 *
 *   CF_API_TOKEN    Account Analytics 읽기 권한이 있는 토큰
 *   CF_ACCOUNT_ID   (선택) 계정을 옮겼을 때만. 기본값이 코드에 있다
 *
 * **이 값은 저장소에 넣지 않는다.** 토큰이 있으면 계정의 통계를 읽을 수 있다.
 *
 * 토큰이 없거나 불러오기에 실패해도 빌드를 멈추지 않는다. 그때는 파일을
 * 건드리지 않고 넘어가며, 글 아래에는 같은 주제의 글이 나간다.
 * 통계 한 번 못 읽었다고 사이트 배포가 막히는 편이 훨씬 나쁘다.
 */
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.join(process.cwd(), 'content', 'popular.json')
const API = 'https://api.cloudflare.com/client/v4'
/**
 * 계정 번호. 대시보드 주소에 그대로 드러나는 식별자라 비밀이 아니다.
 * 토큰과 달리 이것만으로는 아무것도 할 수 없다.
 *
 * 처음에는 토큰으로 계정을 찾게 했는데 막혔다. `Account Analytics · Read` 는
 * 통계를 읽는 권한이지 계정 목록을 보는 권한이 아니다. 계정을 찾겠다고
 * 토큰 권한을 넓히는 것은 앞뒤가 바뀐 일이라, 번호를 적어 둔다.
 */
const ACCOUNT_ID = process.env.CF_ACCOUNT_ID || '2166526a955439000481b67d1cc1c7a9' // kleneed7 계정(AAM 블로그). 대시보드 주소에 드러나는 값이라 비밀이 아니다.

/**
 * Web Analytics 사이트 표식.
 *
 * **글 안에 심는 beacon 토큰과 다른 값이다.** 처음에 beacon 토큰을 넣었더니
 * 오류 없이 0개가 돌아와, 방문이 없는 것인지 값이 틀린 것인지 알 수 없었다.
 * 대시보드에는 조회 142회가 찍혀 있었으므로 값이 틀린 쪽이었다.
 *
 * 대시보드 → Web Analytics → 사이트의 「Manage site」 주소 끝에 붙어 있다.
 *   .../web-analytics/edit/<이 값>
 */
const SITE_TAG = process.env.CF_SITE_TAG || '291a064cdb87499c8c9d6ead9c82279d' // blog.aamkorea.co.kr Web Analytics 사이트 태그(kleneed7 계정). Manage site 주소 끝값.
/** 며칠치를 볼 것인가. 너무 길면 옛 글이 계속 위에 남고, 짧으면 들쭉날쭉하다. */
const DAYS = 30
/** 몇 편을 적어 둘 것인가. 글 아래에는 셋만 쓰지만 여유를 둔다. */
const KEEP = 10

const 로그 = (m) => console.log(`[인기글] ${m}`)

async function cf(url, init) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.CF_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  const body = await res.json()
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(body).slice(0, 300)}`)
  return body
}

/** 최근 DAYS 일 동안 많이 열린 경로를 가져온다. */
async function 상위경로(accountTag) {
  const since = new Date(Date.now() - DAYS * 864e5).toISOString()
  const until = new Date().toISOString()
  const query = `
    query TopPaths($accountTag: String!, $siteTag: String!, $since: Time!, $until: Time!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          rumPageloadEventsAdaptiveGroups(
            filter: { siteTag: $siteTag, datetime_geq: $since, datetime_leq: $until }
            orderBy: [count_DESC]
            limit: 100
          ) {
            count
            dimensions { requestPath }
          }
        }
      }
    }`
  const body = await cf(`${API}/graphql`, {
    method: 'POST',
    body: JSON.stringify({ query, variables: { accountTag, siteTag: SITE_TAG, since, until } }),
  })
  if (body.errors?.length) throw new Error(JSON.stringify(body.errors).slice(0, 400))
  const rows = body?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups ?? []
  return rows.map((r) => ({ path: r.dimensions?.requestPath ?? '', count: r.count ?? 0 }))
}

/** /blog/글-주소/ 만 남기고 슬러그로 바꾼다. 목록·카테고리·노무사 쪽은 뺀다. */
function 글만추리기(rows) {
  const 제외 = ['category', 'page', '노무사', '시리즈', '자가진단']
  const out = []
  const seen = new Set()
  for (const { path: p, count } of rows) {
    let s
    try {
      s = decodeURIComponent(p || '')
    } catch {
      continue
    }
    const m = /^\/blog\/([^/?#]+)\/?$/.exec(s.split('?')[0])
    if (!m) continue
    const slug = m[1]
    if (제외.includes(slug) || seen.has(slug)) continue
    seen.add(slug)
    out.push({ slug, count })
  }
  return out
}

async function main() {
  if (!process.env.CF_API_TOKEN) {
    로그('CF_API_TOKEN 이 없어 건너뜁니다. 글 아래에는 같은 주제의 글이 나갑니다.')
    return
  }

  const rows = await 상위경로(ACCOUNT_ID)
  로그(`최근 ${DAYS}일 경로 ${rows.length}개를 받았습니다.`)

  const posts = 글만추리기(rows).slice(0, KEEP)
  // 셋을 못 채우면 순위라고 부르지 않는다. 두 편짜리 순위는 순위가 아니다.
  // 이럴 때 파일을 비우면 있던 순위까지 지우게 되므로 건드리지 않는다.
  if (posts.length < 3) {
    로그(`글이 ${posts.length}편뿐이라 아직 순위를 만들지 않습니다. 기존 파일을 그대로 둡니다.`)
    return
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(
    OUT,
    JSON.stringify({ 기준: `최근 ${DAYS}일`, 만든때: new Date().toISOString(), 글: posts }, null, 2),
    'utf-8'
  )
  로그(`상위 ${posts.length}편을 적었습니다.`)
  for (const [i, p] of posts.slice(0, 5).entries()) 로그(`  ${i + 1}. ${p.count}회  ${p.slug}`)
}

main().catch((e) => {
  // 빌드를 멈추지 않는다. 통계를 못 읽은 것보다 배포가 막히는 편이 훨씬 나쁘다.
  로그(`불러오지 못했습니다 — ${e.message}`)
  로그('글 아래에는 같은 주제의 글이 나갑니다. 배포는 그대로 진행합니다.')
})
