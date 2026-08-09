/**
 * 검수·초안 글을 보여줄 배포인지 판단한다.
 *
 * 이 값이 켜지면 두 가지가 함께 일어난다.
 * 아직 발행하지 않은 글이 목록에 나오고, 페이지 전체에 검색 색인 차단이 걸린다.
 * 둘은 반드시 같이 움직여야 한다. 초안이 보이는 주소가 검색에 잡히면
 * 같은 글이 두 곳에 존재하게 되어 실제 사이트 순위를 깎는다.
 *
 * 브랜치 이름을 직접 보는 이유는 호스팅에 기대지 않기 위해서다.
 * Netlify는 브랜치 배포에 색인 차단을 자동으로 걸어줬지만 Cloudflare는 걸어주지 않는다.
 * 환경변수 설정을 빠뜨려도 브랜치만 맞으면 안전한 쪽으로 동작하게 해 둔다.
 */

/** 실제 사이트가 나가는 브랜치. 이 브랜치가 아니면 검토용 배포로 본다. */
const PRODUCTION_BRANCH = 'main'

const CI_BRANCH = (
  process.env.WORKERS_CI_BRANCH || // Cloudflare Workers Builds
  process.env.CF_PAGES_BRANCH || // Cloudflare Pages
  process.env.BRANCH || // Netlify
  ''
).trim()

export const SHOW_DRAFTS =
  process.env.NODE_ENV === 'development' ||
  process.env.SHOW_DRAFTS === '1' ||
  (CI_BRANCH !== '' && CI_BRANCH !== PRODUCTION_BRANCH)
