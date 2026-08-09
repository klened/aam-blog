import { Client, isFullBlock, isFullPage } from '@notionhq/client'
import type {
  BlockObjectResponse,
  PageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints'
import { toSlug } from './slug'
import { isSampleMode, sampleBlocks, samplePosts } from './sample'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
  notionVersion: '2022-06-28',
})

const DATABASE_ID = process.env.NOTION_DATABASE_ID || ''

/** 노션 블록을 자식까지 포함해 담는 형태 */
export type NBlock = BlockObjectResponse & { children?: NBlock[] }

export type Post = {
  id: string
  slug: string
  title: string
  /** meta description으로 쓰인다. 비어 있으면 첫 문단에서 뽑는다. */
  summary: string
  category: string
  tags: string[]
  publishedAt: string
  updatedAt: string
  author: string
  authorTitle: string
  lawName: string
  lawUrl: string
  coverImage: string
  /**
   * 대표이미지를 설명하는 글. 본문 첫 줄의 `![...]` 대괄호 안에서 가져온다.
   * 표지는 본문에서 떼어 위쪽에 따로 그리는데, 그때 이 설명을 함께 옮기지
   * 않으면 화면을 못 보는 사람에게 그림이 아예 없는 것이 된다.
   */
  coverAlt: string
  cta: string
  /** 글 맨 위 '핵심만 먼저' 상자. AI 검색이 인용하기 가장 좋은 형태다. */
  keyPoints: string[]
  /** 이 글이 누구를 향하는지. 예: '요양원·재가센터 시설장'. */
  reader: string
  /** 제목 아래 한 줄. 제목이 못 담는 검색어를 여기서 받는다. */
  subtitle: string
  /**
   * 사업주인가 근로자인가.
   *
   * 같은 분야라도 어느 쪽이 읽느냐에 따라 놓치는 자리가 다르다. 글 끝 문단을
   * 카테고리와 이 값의 짝으로 고르므로, 담당자를 정할 때만 쓰던 값을
   * 여기까지 들고 온다.
   */
  target: string
  /** 읽고 나면 무엇을 할 수 있게 되는지 한 문장. */
  gain: string
  /** 구글시트 MAP 의 키워드. 시트가 이 값으로 글 주소를 찾아간다. */
  keyword: string
  /** 본문 길이로 계산한 예상 읽는 시간(분). */
  readingMinutes: number
  /** 무엇을 언제 기준으로 확인했는지. 법령이 자주 바뀌어 신뢰 신호가 된다. */
  updateNote: string
  /** 글 끝에 붙일 자가진단. 비우면 나오지 않는다. */
  tool: string
  /** 시리즈 이름. 비우면 낱개 글이다. */
  series: string
  /** 시리즈 안에서의 회차. 1부터 센다. */
  seriesNo: number
  /** 발행 / 검수 / 초안. 개발 서버에서만 검수·초안이 보인다. */
  status: string
  blocks: NBlock[]
}

export type PostMeta = Omit<Post, 'blocks'>

/* ────────────────────────── 속성 읽기 헬퍼 ────────────────────────── */

type Props = PageObjectResponse['properties']

function plain(rich: Array<{ plain_text: string }> | undefined): string {
  if (!rich || rich.length === 0) return ''
  return rich.map((r) => r.plain_text).join('').trim()
}

function readText(props: Props, key: string): string {
  const p = props[key]
  if (!p) return ''
  if (p.type === 'rich_text') return plain(p.rich_text)
  if (p.type === 'title') return plain(p.title)
  if (p.type === 'url') return p.url ?? ''
  if (p.type === 'select') return p.select?.name ?? ''
  if (p.type === 'status') return p.status?.name ?? ''
  if (p.type === 'formula' && p.formula.type === 'string') return p.formula.string ?? ''
  return ''
}

function readDate(props: Props, key: string): string {
  const p = props[key]
  if (p?.type === 'date') return p.date?.start ?? ''
  if (p?.type === 'last_edited_time') return p.last_edited_time
  if (p?.type === 'created_time') return p.created_time
  return ''
}

function readMulti(props: Props, key: string): string[] {
  const p = props[key]
  if (p?.type === 'multi_select') return p.multi_select.map((s) => s.name)
  return []
}

function readFile(props: Props, key: string): string {
  const p = props[key]
  if (p?.type !== 'files' || p.files.length === 0) return ''
  const f = p.files[0]
  if (f.type === 'external') return f.external.url
  if (f.type === 'file') return f.file.url
  return ''
}

/** 노션 파일 URL은 1시간 뒤 만료되므로 커버는 외부 URL 사용을 권장한다. */
function readCover(page: PageObjectResponse): string {
  const c = page.cover
  if (!c) return ''
  return c.type === 'external' ? c.external.url : c.file.url
}

/* ────────────────────────── 조회 ────────────────────────── */

function requireEnv() {
  if (!process.env.NOTION_TOKEN || !DATABASE_ID) {
    throw new Error(
      '[notion] NOTION_TOKEN 또는 NOTION_DATABASE_ID 가 설정되지 않았습니다. .env.example을 참고해 환경변수를 채워주세요.'
    )
  }
}

let cachedMeta: PostMeta[] | null = null

/** 발행 상태인 글의 목록을 최신순으로 가져온다. */
export async function getPublishedPosts(): Promise<PostMeta[]> {
  if (cachedMeta) return cachedMeta

  if (isSampleMode()) {
    console.warn('[notion] SAMPLE_CONTENT=1 — 노션 대신 샘플 글로 빌드합니다.')
    cachedMeta = samplePosts()
    return cachedMeta
  }

  requireEnv()

  const results: PageObjectResponse[] = []
  let cursor: string | undefined = undefined

  do {
    const res = await notion.databases.query({
      database_id: DATABASE_ID,
      start_cursor: cursor,
      page_size: 100,
      filter: {
        and: [
          { property: '상태', select: { equals: '발행' } },
          { property: '노출', checkbox: { equals: true } },
        ],
      },
      sorts: [{ property: '발행일', direction: 'descending' }],
    })
    for (const p of res.results) if (isFullPage(p)) results.push(p)
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)

  const seen = new Set<string>()
  const posts = results.map((page) => {
    const props = page.properties
    const title = readText(props, '제목')
    let slug = toSlug(readText(props, '슬러그') || title)
    // 슬러그 충돌 방지
    if (seen.has(slug)) {
      let n = 2
      while (seen.has(`${slug}-${n}`)) n += 1
      slug = `${slug}-${n}`
    }
    seen.add(slug)

    const published = readDate(props, '발행일') || page.created_time
    const updated = readDate(props, '최종수정일') || page.last_edited_time

    return {
      id: page.id,
      slug,
      title,
      summary: readText(props, '요약'),
      category: readText(props, '카테고리'),
      tags: readMulti(props, '태그'),
      publishedAt: published,
      updatedAt: updated,
      author: readText(props, '작성자'),
      authorTitle: readText(props, '작성자직함') || '',
      lawName: readText(props, '근거법령'),
      lawUrl: readText(props, '근거법령링크'),
      coverImage: readFile(props, '대표이미지') || readCover(page),
      cta: readText(props, 'CTA유형') || '채팅상담',
      coverAlt: '',
      keyPoints: [],
      reader: '',
      subtitle: '',
      target: '',
      gain: '',
      keyword: '',
      readingMinutes: 0,
      updateNote: '',
      tool: '',
      series: '',
      seriesNo: 0,
      status: readText(props, '상태') || '발행',
    } satisfies PostMeta
  })

  cachedMeta = posts.filter((p) => p.title && p.slug)
  return cachedMeta
}

/** 블록을 자식까지 재귀로 모두 읽는다. */
async function fetchBlocks(blockId: string, depth = 0): Promise<NBlock[]> {
  if (depth > 3) return []
  const out: NBlock[] = []
  let cursor: string | undefined = undefined

  do {
    const res = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    })
    for (const b of res.results) {
      if (!isFullBlock(b)) continue
      const node = b as NBlock
      if (b.has_children) node.children = await fetchBlocks(b.id, depth + 1)
      out.push(node)
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)

  return out
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const metas = await getPublishedPosts()
  const meta = metas.find((m) => m.slug === slug)
  if (!meta) return null
  if (isSampleMode()) return { ...meta, blocks: sampleBlocks() }
  const blocks = await fetchBlocks(meta.id)
  return { ...meta, blocks }
}

/** 같은 카테고리의 다른 글을 최대 n개 고른다. 없으면 최신 글로 채운다. */
export function pickRelated(all: PostMeta[], current: PostMeta, n = 3): PostMeta[] {
  const same = all.filter((p) => p.slug !== current.slug && p.category === current.category)
  const rest = all.filter((p) => p.slug !== current.slug && p.category !== current.category)
  return [...same, ...rest].slice(0, n)
}
