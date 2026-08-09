import { popularSlugs } from './popular'
import { categorySlug } from './slug'
import type { NBlock, PostMeta } from './notion'
import { getPostBySlug, getPublishedPosts } from './notion'
import { isSampleMode } from './sample'
import { firstParagraphOf, hasMarkdownPosts, readMarkdownPosts } from './markdown'
import {
  buildAnchorMap,
  buildToc,
  clampDescription,
  extractFaq,
  firstParagraph,
  type FaqItem,
  type TocItem,
} from './blocks'

/**
 * 글 저장소 추상화.
 * 노션과 마크다운 두 가지 백엔드를 지원한다. 환경에 따라 자동으로 고른다.
 *
 *   1) SAMPLE_CONTENT=1                       → 샘플 (화면 확인용)
 *   2) NOTION_TOKEN + NOTION_DATABASE_ID 있음  → 노션
 *   3) content/posts/*.md 있음                 → 마크다운 파일
 *
 * 노션 토큰을 발급받기 전에는 마크다운으로 시작하고,
 * 나중에 환경변수만 채우면 노션으로 넘어간다. 코드는 바꿀 필요가 없다.
 */

export type Backend = 'sample' | 'notion' | 'markdown' | 'none'

export function backend(): Backend {
  if (isSampleMode()) return 'sample'
  if (process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID) return 'notion'
  if (hasMarkdownPosts()) return 'markdown'
  return 'none'
}

/**
 * 발행된 글이 하나도 없을 때 쓰는 자리표시 슬러그.
 * Next.js는 output:export 에서 동적 경로에 최소 한 개의 파라미터를 요구하기 때문에,
 * 글이 없으면 빌드가 실패한다. 이 페이지는 noindex 처리되고 사이트맵에도 들어가지 않으며,
 * 글을 한 편이라도 발행하면 사라진다.
 */
export const PLACEHOLDER_SLUG = '준비중'

export type PostContent =
  | { kind: 'notion'; blocks: NBlock[] }
  | { kind: 'html'; html: string; head: string; tail: string }

export type FullPost = {
  meta: PostMeta
  content: PostContent
  toc: TocItem[]
  faqs: FaqItem[]
  /** meta description. 요약이 없으면 첫 문단에서 뽑는다. */
  description: string
}

const NO_SOURCE_MESSAGE = [
  '글 저장소를 찾지 못했습니다. 아래 중 하나를 준비해주세요.',
  '',
  '  1) 노션을 쓰는 경우 : .env 에 NOTION_TOKEN 과 NOTION_DATABASE_ID 를 채웁니다.',
  '  2) 마크다운을 쓰는 경우 : content/posts/ 폴더에 .md 파일을 둡니다.',
  '  3) 화면만 볼 경우 : npm run dev:sample 로 실행합니다.',
].join('\n')

export async function listPosts(): Promise<PostMeta[]> {
  const b = backend()
  if (b === 'markdown') return readMarkdownPosts().map((p) => p.meta)
  if (b === 'none') throw new Error(NO_SOURCE_MESSAGE)
  return getPublishedPosts()
}

export async function getPost(slug: string): Promise<FullPost | null> {
  const b = backend()

  if (b === 'markdown') {
    const found = readMarkdownPosts().find((p) => p.meta.slug === slug)
    if (!found) return null
    return {
      meta: found.meta,
      content: { kind: 'html', html: found.html, head: found.htmlHead, tail: found.htmlTail },
      toc: found.toc,
      faqs: found.faqs,
      description: clampDescription(found.meta.summary || firstParagraphOf(found)),
    }
  }

  if (b === 'none') throw new Error(NO_SOURCE_MESSAGE)

  const post = await getPostBySlug(slug)
  if (!post) return null
  const anchors = buildAnchorMap(post.blocks)
  return {
    meta: post,
    content: { kind: 'notion', blocks: post.blocks },
    toc: buildToc(post.blocks, anchors),
    faqs: extractFaq(post.blocks),
    description: clampDescription(post.summary || firstParagraph(post.blocks)),
  }
}

/** 노션 렌더링에 필요한 앵커 맵. 마크다운은 렌더 시점에 이미 부여돼 있다. */
export function anchorsOf(content: PostContent): Map<string, string> {
  return content.kind === 'notion' ? buildAnchorMap(content.blocks) : new Map()
}

/** 같은 카테고리의 다른 글을 최대 n개 고른다. 없으면 최신 글로 채운다. */
export function pickRelated(all: PostMeta[], current: PostMeta, n = 3): PostMeta[] {
  const same = all.filter((p) => p.slug !== current.slug && p.category === current.category)
  const rest = all.filter((p) => p.slug !== current.slug && p.category !== current.category)
  return [...same, ...rest].slice(0, n)
}

/**
 * 글 아래에 걸 글을 고른다.
 *
 * 조회수 상위 글이 채워져 있으면 그 순서로 내보내고 「지금 인기있는 글」이 된다.
 * 비어 있으면 같은 주제의 글을 내보낸다.
 *
 * 비었을 때 아무 글이나 섞지 않는 이유는 두 가지다. 읽던 주제와 이어지는 글이
 * 독자에게 더 쓸모 있고, 글마다 다른 글이 걸려야 사이트 안의 길이 촘촘해진다.
 * 모든 글 아래에 같은 세 편을 걸면 그 길이 하나로 줄어든다.
 */
export function pickForFooter(
  all: PostMeta[],
  current: PostMeta,
  n = 3
): { posts: PostMeta[]; ranked: boolean } {
  const ranked = popularSlugs()
    .map((s) => all.find((p) => p.slug === s))
    .filter((p): p is PostMeta => !!p && p.slug !== current.slug)
    .slice(0, n)

  // 상위 글이 모자라면 순위라고 부르지 않는다. 두 편짜리 순위는 순위가 아니다.
  if (ranked.length >= n) return { posts: ranked, ranked: true }
  return { posts: pickRelated(all, current, n), ranked: false }
}

/**
 * 카테고리 URL 슬러그. 본체는 slug.ts 에 있고 여기서는 다시 내보내기만 한다.
 *
 * 이 모듈은 node:fs 를 가져오므로 클라이언트 컴포넌트가 여기서 꺼내 쓰면
 * 번들에 파일시스템이 딸려 들어가 빌드가 깨진다. 화면 쪽은 slug.ts 에서
 * 직접 가져가고, 서버 쪽에서 부르던 곳들은 이 이름을 그대로 쓴다.
 */
export { categorySlug }

export function categoryFromSlug(slug: string, categories: string[]): string | null {
  const decoded = decodeURIComponent(slug)
  return categories.find((c) => categorySlug(c) === decoded) ?? null
}

/** 발행 글에 실제로 쓰인 카테고리를 글 수가 많은 순으로 돌려준다. */
export async function listCategories(): Promise<{ name: string; count: number }[]> {
  const posts = await listPosts()
  const counts = new Map<string, number>()
  for (const p of posts) {
    if (!p.category) continue
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}
