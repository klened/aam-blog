/**
 * 사이트 전역 설정.
 * 회사 정보와 CTA 문구를 여기서만 고치면 전체 글에 반영된다.
 */

export const SITE = {
  /**
   * 글이 실제로 노출될 도메인. 끝에 슬래시를 넣지 않는다.
   *
   * 기본값을 실제 주소로 둔다. 환경변수를 빠뜨려도 canonical 주소와 사이트맵이
   * 틀리지 않게 하기 위해서다. 호스팅을 옮길 때 대시보드에서 설정할 것이 하나 줄어든다.
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://blog.aamkorea.co.kr').replace(/\/$/, ''),

  /** 블로그가 놓이는 경로. next.config 및 폴더 구조와 일치해야 한다. */
  basePath: '/blog',

  name: '3D프린팅 인사이트',
  description:
    '스트라타시스·폼랩·얼티메이커 공식 파트너 더블에이엠 기술팀이 쓰는 3D프린팅 실무 가이드입니다. 장비 선택, 소재, 후처리, 산업별 활용 사례를 도입 담당자 관점에서 정리합니다.',

  locale: 'ko_KR',
  language: 'ko',
} as const

/**
 * 같은 창에서 이어 보게 둘 주소.
 *
 * 블로그 자신과 회사 홈페이지가 여기 든다. 지금은 둘 다 aamkorea.co.kr 이지만,
 * 블로그를 다른 도메인으로 옮겨도 SITE.url 만 고치면 되고 이 목록은 그대로 둔다.
 */
const OWN_HOSTS = [new URL(SITE.url).hostname, 'aamkorea.co.kr'] as const

/** 링크를 새 탭으로 열지 정한다. 상대 주소와 우리 도메인은 같은 창에서 연다. */
export function isExternalHref(href: string): boolean {
  if (!/^https?:\/\//.test(href)) return false
  return !OWN_HOSTS.some((host) => href.includes(host))
}

/**
 * 글쓴이 명부는 별도 파일로 뺐다.
 * 여기서 다시 내보내므로 쓰는 쪽 코드는 바뀌지 않는다.
 */
export { MEMBERS, member, memberAvatar, memberLabel } from './members'
export type { Member } from './members'

/**
 * 담당 배정.
 *
 * 지금은 기술팀 명의 하나로 모든 분야를 쓴다. 실무 엔지니어가 실명으로
 * 참여하게 되면 members.ts 에 사람을 추가하고 여기서 분야를 나눠 준다.
 *
 * 여럿이 되면 누가 되는지는 **글 주소로 정해진다**. 진짜 난수를 쓰면 빌드할
 * 때마다 같은 글의 글쓴이가 바뀌어 검색엔진이 작성자를 신뢰할 수 없게 된다.
 * 특정인을 못박아야 하면 글의 `작성자` 를 직접 적으면 된다. 그게 항상 이긴다.
 */
export const CATEGORY_OWNERS: Record<string, string[]> = {
  '3D프린터 도입 가이드': ['더블에이엠 기술팀'],
  'SLA·레진 프린팅': ['더블에이엠 기술팀'],
  'SLS·분말 프린팅': ['더블에이엠 기술팀'],
  'FDM 프린팅': ['더블에이엠 기술팀'],
  'PolyJet·풀컬러': ['더블에이엠 기술팀'],
  '소재 가이드': ['더블에이엠 기술팀'],
  '후처리·장비 운영': ['더블에이엠 기술팀'],
  '활용 사례': ['더블에이엠 기술팀'],
  '3D프린팅 일반': ['더블에이엠 기술팀'],
}

/** 카테고리 담당이 정해지지 않은 주제의 기본값. */
export const AUDIENCE_OWNERS: Record<string, string[]> = {
  도입검토: ['더블에이엠 기술팀'],
  운영실무: ['더블에이엠 기술팀'],
}

/**
 * 태그로 담당을 못박는다. 카테고리보다 세다.
 * 지금은 쓰지 않는다. 분야 전담자가 생기면 여기 적는다.
 */
export const TAG_OWNER: Record<string, string> = {}

/**
 * 문자열을 고르게 흩어진 숫자로 바꾼다(FNV-1a).
 * 비슷한 주소끼리 같은 사람에게 몰리지 않게 하려고 쓴다.
 */
function spread(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * 담당자를 정한다. 순서가 있다.
 *
 *   1. 태그에 담당이 못박힌 것이 있으면 그 사람 (TAG_OWNER)
 *   2. 없으면 카테고리 명단에서 글 주소로 뽑는다
 *
 * 주소로 뽑는 이유는 같은 글이 언제 빌드해도 같은 사람이어야 하기 때문이다.
 */
export function resolveOwner(
  category: string,
  audience: string | undefined,
  key: string,
  tags: string[] = []
): string {
  for (const t of tags) {
    const 못박힌 = TAG_OWNER[t.trim()]
    if (못박힌) return 못박힌
  }
  const pool =
    CATEGORY_OWNERS[category] ??
    AUDIENCE_OWNERS[audience || '도입검토'] ?? ['더블에이엠 기술팀']
  if (pool.length === 0) return '더블에이엠 기술팀'
  return pool[spread(key) % pool.length]
}

/**
 * 검색엔진 소유 확인 값.
 *
 * 서치콘솔·서치어드바이저에 사이트를 등록할 때 "이 사이트가 당신 것이 맞다"를
 * 증명하는 값이다. 비밀값이 아니라 공개 HTML에 그대로 박히는 값이고,
 * 비워 두면 태그 자체가 나가지 않는다.
 *
 * 배포 뒤 서치콘솔·서치어드바이저에 등록하면서 받은 값을 채운다.
 */
export const VERIFY = {
  google: process.env.NEXT_PUBLIC_GOOGLE_VERIFY ?? '7o5zFd_vJovzcek8knV3yl4c53GFdARDspVAQcSwT8k',
  naver: process.env.NEXT_PUBLIC_NAVER_VERIFY ?? 'd90efe63dd476c679a9e1445e2a99484ee6fcac7',
} as const

/**
 * 방문자 분석.
 *
 * 두 값 모두 비밀값이 아니라 공개 HTML에 박히는 값이다. 비워 두면 스크립트가
 * 아예 나가지 않는다. 배포 뒤에 채운다.
 *
 *   beaconToken : Cloudflare Web Analytics 토큰. 쿠키를 쓰지 않아 동의 배너가 필요 없다.
 *   gaId        : GA4 측정 ID. 홈페이지(aamkorea.co.kr)가 GA를 쓰고 있다면 **같은
 *                 값을 쓴다.** 블로그가 서브도메인이라 측정 ID가 같으면 쿠키가
 *                 `.aamkorea.co.kr` 에 붙어, 블로그를 읽고 홈페이지로 넘어간 사람이
 *                 한 사람으로 이어진다. 우리가 알고 싶은 것이 「읽은 사람이 견적
 *                 문의까지 갔는가」이므로 끊어서 얻을 것이 없다.
 */
export const ANALYTICS = {
  beaconToken: process.env.NEXT_PUBLIC_CF_BEACON_TOKEN ?? '',
  gaId: process.env.NEXT_PUBLIC_GA_ID ?? '',
} as const

/**
 * 홈페이지에 이미 있는 도구·안내 페이지.
 *
 * 새로 만드는 것이 아니라 연결만 한다. 글을 읽고 "우리 일에 맞는 장비·소재가
 * 뭘까" 싶을 때 바로 눌러볼 곳이 필요하다.
 *
 * 순서는 목록 페이지에 나오는 순서다. 맨 위가 가장 넓게 쓰이는 것이어야 한다.
 */
export const TOOLS = [
  {
    name: '3D프린팅 소재 추천',
    desc: '어떤 소재를 써야 할지 모르겠다면 여기서 시작하세요. 용도를 고르면 맞는 소재를 알려드립니다.',
    href: 'https://aamkorea.co.kr/recommend',
    icon: '🧭',
  },
  {
    name: '견적·상담 문의',
    desc: '장비 도입이나 출력 서비스 견적이 필요하면 상황을 알려주세요. 담당 엔지니어가 회신드립니다.',
    href: 'https://aamkorea.co.kr/request',
    icon: '💬',
  },
  {
    name: '제작 서비스 사례',
    desc: '시제품·치공구·소량생산 의뢰가 실제로 어떻게 진행됐는지 확인합니다.',
    href: 'https://aamkorea.co.kr/usercase',
    icon: '🏭',
  },
  {
    name: '기술자료 다운로드',
    desc: '장비 사양서, 소재 데이터시트, 활용 가이드를 내려받을 수 있습니다.',
    href: 'https://aamkorea.co.kr/download',
    icon: '📄',
  },
  {
    name: '스토어',
    desc: '데스크톱 3D프린터와 소모품을 온라인으로 바로 구매합니다.',
    href: 'https://aamkorea.co.kr/store',
    icon: '🛒',
  },
] as const

/**
 * 도구는 기본으로 나오지 않는다.
 *
 * 카테고리만 맞다고 자동으로 붙이면 글 주제와 어긋난 도구가 걸린다.
 * 그래서 글마다 프런트매터에서 직접 켠다.
 *
 *   자가진단: 예                      → 아래 표에서 카테고리에 맞는 것
 *   자가진단: 3D프린팅 소재 추천       → 이름을 적으면 그 도구
 *   (비워 두면)                        → 아무것도 나오지 않는다
 */
export const CATEGORY_TOOL: Record<string, string> = {
  '소재 가이드': '3D프린팅 소재 추천',
  'SLA·레진 프린팅': '3D프린팅 소재 추천',
  'SLS·분말 프린팅': '3D프린팅 소재 추천',
  'FDM 프린팅': '3D프린팅 소재 추천',
  'PolyJet·풀컬러': '견적·상담 문의',
  '3D프린터 도입 가이드': '견적·상담 문의',
  '활용 사례': '제작 서비스 사례',
  '후처리·장비 운영': '기술자료 다운로드',
}

/** 글에 적힌 값으로 도구를 고른다. 켜지 않았으면 null. */
export function toolFor(pick: string, category: string) {
  const on = pick.trim()
  if (!on) return null
  const byName = TOOLS.find((t) => t.name === on)
  if (byName) return byName
  const want = CATEGORY_TOOL[category]
  return TOOLS.find((t) => t.name === want) ?? TOOLS[0]
}

/**
 * 조회수 상위 글.
 *
 * 정적 사이트라 화면을 그릴 때 조회 기록을 읽을 수 없다. Cloudflare 통계가
 * 쌓이면 빌드할 때 불러와 채운다(scripts/fetch-popular.mjs). 그전까지는
 * 비어 있고, 비어 있으면 글 아래에는 같은 주제의 글이 나간다.
 * **없는 숫자로 「인기」라는 딱지를 붙이지 않는다.**
 */
export const POPULAR = {
  slugs: [] as string[],
}

/**
 * 목록 맨 위 표지.
 *
 * 사이트 이름 아래에 한 줄 적는다. 잡지 표지처럼 "지금도 돌아가고 있는 곳"
 * 이라는 신호를 준다. 달을 적으면 지나간 뒤에 티가 나므로 상황으로 부른다.
 */
export const MASTHEAD = {
  active: true,
  issue: '3D프린팅 기술 칼럼',
} as const

/**
 * 배너 사진 크기.
 *
 * 배너는 클라이언트에서 도는 부품이라 파일을 열어 크기를 읽을 수 없다.
 * 모두 같은 크기로 잘라 넣으므로 여기에 적어 둔다.
 */
export const BANNER_IMAGE = { width: 720, height: 540 } as const

/**
 * 목록 맨 위 시즌 배너.
 *
 * 본문에 쓰는 수치는 반드시 이미 발행한 글에 있는 것만 옮긴다.
 * 배너에서 새 주장을 만들면 근거가 없는 문장이 첫 화면에 걸린다.
 *
 * 발행 글이 쌓여 걸 만한 것이 생기면 active 를 true 로 바꾸고 items 를 채운다.
 * links 의 href 는 실제 발행 글 주소여야 한다.
 */
export const SEASONAL = {
  active: false,
  items: [] as {
    label: string
    image: string
    heading: string
    body: string
    links: { text: string; href: string }[]
  }[],
} as const

/**
 * 대표이미지가 없는 글에 쓸 기본 사진.
 *
 * 글마다 주제를 보여주는 사진을 `대표이미지` 에 직접 적는 편이 언제나 낫다.
 * 여기는 그것이 없을 때의 안전망이다. 카테고리별 기본 사진이 준비되면 채운다.
 */
export const CATEGORY_COVER: Record<string, string> = {}

/**
 * 카테고리 첫 화면과 검색결과에 나가는 안내 문장.
 *
 * 여기서 무엇을 확인하고 무엇을 정할 수 있는지만 적는다. 한 문장을 넘기지 않는다.
 */
export const CATEGORY_INTRO: Record<string, string> = {
  '3D프린터 도입 가이드':
    '용도와 예산에 맞는 방식(FDM·SLA·SLS·PolyJet)을 가늠해 보고, 도입 전에 확인할 것을 정하실 수 있습니다.',
  'SLA·레진 프린팅':
    '레진 방식의 정밀도와 소재 선택지를 확인하고, 우리 부품에 맞는지 판단하실 수 있습니다.',
  'SLS·분말 프린팅':
    '서포트 없는 분말 방식의 강점과 운영 조건을 확인하고, 기능성 부품 생산에 맞는지 가늠하실 수 있습니다.',
  'FDM 프린팅':
    '가장 널리 쓰이는 방식의 소재·정밀도·비용을 확인하고, 어디까지 맡길 수 있는지 정하실 수 있습니다.',
  'PolyJet·풀컬러':
    '풀컬러·복합소재 출력이 가능한 방식의 특성과 적합한 용도를 확인하실 수 있습니다.',
  '소재 가이드':
    '강도·내열·인증 요건에 맞는 소재를 골라 보고, 데이터시트에서 확인할 항목을 정하실 수 있습니다.',
  '후처리·장비 운영':
    '세척·경화·표면처리 같은 후공정과 장비 유지관리에서 막히는 지점을 미리 확인하실 수 있습니다.',
  '활용 사례':
    '같은 업종·비슷한 부품에서 3D프린팅이 실제로 어떻게 쓰였는지 확인하실 수 있습니다.',
  '3D프린팅 일반':
    '적층제조를 처음 검토할 때 알아야 할 기준과 다음에 할 일을 확인하실 수 있습니다.',
}

/** 안내 문장을 아직 안 적은 카테고리도 빈칸으로 두지 않는다. */
export function categoryIntro(name: string): string {
  return (
    CATEGORY_INTRO[name] ??
    '지금 상황이 어디에 해당하는지 확인해 보고, 다음에 할 일을 정하실 수 있습니다.'
  )
}

/** 어느 카테고리에도 걸리지 않을 때 쓰는 기본 표지. */
export const DEFAULT_COVER = '/images/brand-card.png'

/** 글에 적힌 대표이미지가 우선이고, 없을 때만 기본 사진을 쓴다. */
export function coverFor(coverImage: string, category: string): string {
  return coverImage.trim() || CATEGORY_COVER[category] || DEFAULT_COVER
}

/**
 * 머리말 로고. 홈페이지와 같은 가로형 워드마크를 쓴다.
 * 로고 안에 이미 회사명이 있으므로 옆에 이름을 또 쓰지 않는다.
 * 경로에 한글이 없어야 미리읽기 헤더에서 인코딩 문제가 나지 않는다.
 */
export const LOGO = { src: '/images/logo.png', width: 560, height: 165 } as const

/**
 * 글 하단 CTA에 쓰는 배너.
 *
 * 로고만 있던 자리를 홈페이지에서 쓰는 「시제품 제작 필요하세요?」 배너로 바꿨다.
 * 담당자 얼굴과 실제 출력물이 함께 들어 있어, 로고보다 「사람이 답한다」가 드러난다.
 *
 * 크기를 함께 적어 둔다. CTA는 클라이언트에서 도는 부품이라 파일을 열어 크기를
 * 읽을 수 없다. 배너를 바꾸면 이 값도 함께 고친다.
 */
export const TEAM_PHOTO = '/images/cta-banner.webp'
export const TEAM_PHOTO_SIZE = { width: 966, height: 242 } as const

export const ORG = {
  name: '더블에이엠',
  legalName: '(주)더블에이엠',
  url: 'https://aamkorea.co.kr',
  logo: `${SITE.url}/images/logo.png`,
  description:
    '스트라타시스·폼랩·얼티메이커 공식 파트너로 산업용 3D프린터 판매와 적층제조 솔루션을 제공하는 기업입니다.',
  sameAs: [] as string[],
} as const

/**
 * 채널톡 상담 위젯.
 * 키를 비워 두면 위젯이 아예 로드되지 않고, 문의 버튼은 홈페이지 문의 페이지로
 * 연결된다. 채팅 상담을 붙이게 되면 환경변수나 여기에 키를 채운다.
 */
export const CHANNEL = {
  pluginKey: process.env.NEXT_PUBLIC_CHANNEL_PLUGIN_KEY ?? '',
} as const

/**
 * 글 하단 CTA. 글의 `CTA유형` 값으로 골라 쓴다.
 *
 * 채팅 위젯이 없으므로 모든 유형이 홈페이지의 해당 페이지로 연결된다.
 * `채팅상담` 키는 템플릿 호환을 위해 남겨 두었고, 지금은 `상담` 과 같다.
 */
export const CTA_PRESETS = {
  채팅상담: {
    heading: '',
    body: '부품마다 조건이 달라서 이 글만으로는 답이 안 나오는 경우가 많습니다. 도면이나 용도를 알려주시면 담당 엔지니어가 직접 확인하고 답해드리겠습니다.',
    buttonText: '견적·상담 문의하기',
    href: 'https://aamkorea.co.kr/request',
    chat: false,
  },
  무료진단: {
    heading: '우리 부품에 맞는 소재를 1분 만에 확인하세요',
    body: '용도만 고르면 맞는 소재와 장비 방식을 알려드립니다.',
    buttonText: '소재 추천 받기',
    href: 'https://aamkorea.co.kr/recommend',
    chat: false,
  },
  체크리스트: {
    heading: '기술자료를 무료로 받아보세요',
    body: '장비 사양서와 소재 데이터시트, 도입 검토에 바로 쓸 수 있는 자료입니다.',
    buttonText: '기술자료 받기',
    href: 'https://aamkorea.co.kr/download',
    chat: false,
  },
  상담: {
    heading: '3D프린팅 출력이 필요하시면 문의해 주세요',
    body: '담당 엔지니어가 부품 조건을 확인한 뒤 회신드립니다.',
    buttonText: '상담 요청하기',
    href: 'https://aamkorea.co.kr/request',
    chat: false,
  },
} as const

export type CtaKey = keyof typeof CTA_PRESETS

/**
 * 목록 왼쪽 분야 메뉴를 나누는 묶음.
 *
 * 메뉴는 늘 같은 자리에 있어야 손이 먼저 간다. 글 수로 세우지 않는다.
 * 여기 안 적은 분야는 맨 아래 이름 없는 묶음으로 따라붙는다.
 */
export const CATEGORY_GROUPS: { 라벨?: string; 목록: string[] }[] = [
  { 목록: ['3D프린터 도입 가이드', '활용 사례', '소재 가이드'] },
  {
    라벨: '방식별 가이드',
    목록: ['SLA·레진 프린팅', 'SLS·분말 프린팅', 'FDM 프린팅', 'PolyJet·풀컬러'],
  },
  {
    라벨: '운영 단계',
    목록: ['후처리·장비 운영', '3D프린팅 일반'],
  },
]

/**
 * 분야를 묶음 순서대로 다시 세운다.
 *
 * 왼쪽 사이드바와 머리글 드롭다운이 같은 목록을 쓰므로 여기 한 곳에서 만든다.
 * 표에 적힌 순서를 따르되 글이 한 편도 없는 분야는 건너뛰고, 표에 없는 분야는
 * 맨 뒤에 이름 없는 묶음으로 붙인다.
 */
export function 분야묶기<T extends { name: string }>(
  분야들: T[]
): { 라벨?: string; 목록: T[] }[] {
  const 남은것 = new Map(분야들.map((c) => [c.name, c]))
  const 묶음들: { 라벨?: string; 목록: T[] }[] = []

  for (const g of CATEGORY_GROUPS) {
    const 목록: T[] = []
    for (const 이름 of g.목록) {
      const c = 남은것.get(이름)
      if (!c) continue
      목록.push(c)
      남은것.delete(이름)
    }
    if (목록.length) 묶음들.push({ 라벨: g.라벨, 목록 })
  }

  if (남은것.size) 묶음들.push({ 목록: [...남은것.values()] })
  return 묶음들
}

/**
 * 카테고리별 아이콘. 목록 사이드바와 배지에 함께 쓴다.
 * 여기에 없는 카테고리는 기본 아이콘으로 표시된다.
 */
export const CATEGORY_ICONS: Record<string, string> = {
  '3D프린터 도입 가이드': '🧭',
  'SLA·레진 프린팅': '💧',
  'SLS·분말 프린팅': '❄️',
  'FDM 프린팅': '🧵',
  'PolyJet·풀컬러': '🎨',
  '소재 가이드': '🧪',
  '후처리·장비 운영': '🛠️',
  '활용 사례': '🏭',
  '3D프린팅 일반': '📋',
}

export function categoryIcon(name: string): string {
  return CATEGORY_ICONS[name] || '📄'
}

/**
 * 글 끝에서 「그래서 물어봐야겠다」로 넘기는 문단.
 *
 * 글을 완결된 답으로 쓰면 읽는 사람은 「알겠다」로 끝난다. 마지막에 두 가지를
 * 남긴다. **혼자 하면 반대로 하기 쉬운 지점**과 **되돌릴 수 없는 시점**이다.
 *
 * 쓸 때 지키는 것: **결과를 보장하는 말을 쓰지 않는다.** 출력 품질과 납기는
 * 부품 형상과 조건에 따라 달라지므로, 진단·검토·설계 제안으로만 적는다.
 *
 * 열쇠는 `카테고리|대상` 이다. 해당하는 것이 없으면 카테고리만으로 찾고,
 * 그것도 없으면 문단을 아예 그리지 않는다. 어설픈 일반론을 붙이느니 없는
 * 편이 낫다. 발행 글이 쌓이면 분야별로 채운다.
 */
export const CATEGORY_HOOK: Record<string, { 짚기: string; 제안: string }> = {
  '3D프린터 도입 가이드|도입검토': {
    짚기:
      '사양표의 최대 조형 크기와 해상도만 비교하시기 쉽습니다. 그런데 실제 도입에서 갈리는 것은 **우리 부품이 그 장비에서 실제로 나오는가**입니다. 같은 사양이라도 소재 제약과 후처리 공정이 달라 결과물이 다릅니다.',
    제안:
      '그래서 저희는 도입 전에 실제 부품으로 샘플 출력을 해 보시라고 권합니다. 도면을 주시면 맞는 방식과 소재를 골라 출력 조건까지 정리해 드립니다.',
  },
  '소재 가이드|도입검토': {
    짚기:
      '데이터시트의 인장강도 숫자만 보고 고르시기 쉽습니다. 그런데 실제로 갈리는 것은 **출력 방향과 후처리에 따른 물성 변화**입니다. 같은 소재라도 조형 방향이 다르면 강도가 다르게 나옵니다.',
    제안:
      '그래서 저희는 부품의 하중 방향과 사용 환경을 먼저 여쭙습니다. 조건에 맞는 소재 후보를 좁히고, 필요하면 시편 출력으로 검증한 뒤 정합니다.',
  },
}

/** 카테고리와 대상으로 찾고, 없으면 카테고리만으로 찾는다. 그것도 없으면 안 그린다. */
export function categoryHook(category: string, target: string) {
  return CATEGORY_HOOK[`${category}|${target}`] ?? CATEGORY_HOOK[category] ?? null
}

/** 브랜드 색상. 로고의 시안 블루와 톤을 맞춘다. globals.css 의 값과 같이 움직인다. */
export const COLORS = {
  navy: '#015D75',
  gold: '#00A0C0',
  ink: '#1a1a1a',
  body: '#333333',
  muted: '#6b7280',
  line: '#e5e7eb',
  tint: '#F0F7FA',
} as const
