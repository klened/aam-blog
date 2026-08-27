import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { Marked } from 'marked'
import type { PostMeta } from './notion'
import type { FaqItem, TocItem } from './blocks'
import { toAnchorId, toSlug } from './slug'
import { isExternalHref } from '@/config/site'
import { imageSize, imageSrc, srcSet as srcSet2 } from './imageSize'
import { member, resolveOwner } from '@/config/site'
import { SHOW_DRAFTS } from './drafts'

/**
 * 마크다운 파일을 글 저장소로 쓰는 백엔드.
 * 노션 토큰 없이 바로 쓸 수 있고, 글이 저장소에 남아 이력 관리가 된다.
 *
 * content/posts/*.md 를 읽는다.
 *
 * 검수·초안을 함께 보여줄지는 lib/drafts.ts 가 판단한다.
 * 초안 노출과 검색 색인 차단이 항상 같이 움직여야 해서 한 곳에 모아 두었다.
 */

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts')

/**
 * 글 파일을 모은다.
 *
 * 글과 그림을 한 폴더에 두므로 `{슬러그}/{슬러그}.md` 가 기본이다. 그림이 없는
 * 글은 폴더를 만들 이유가 없어 `{슬러그}.md` 도 함께 읽는다. 어느 쪽으로 두어도
 * 동작하게 해서 급할 때 파일 하나만 떨궈도 되게 한다.
 */
function 글파일들(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return []
  const out: string[] = []
  for (const d of fs.readdirSync(POSTS_DIR, { withFileTypes: true })) {
    if (d.isFile() && d.name.endsWith('.md')) out.push(d.name)
    else if (d.isDirectory()) {
      for (const f of fs.readdirSync(path.join(POSTS_DIR, d.name))) {
        if (f.endsWith('.md')) out.push(path.join(d.name, f))
      }
    }
  }
  return out.sort()
}

export function hasMarkdownPosts(): boolean {
  try {
    return 글파일들().length > 0
  } catch {
    return false
  }
}

type FrontMatter = {
  제목?: string
  슬러그?: string
  요약?: string
  카테고리?: string
  태그?: string[] | string
  상태?: string
  노출?: boolean
  발행일?: string | Date
  최종수정일?: string | Date
  작성자?: string
  작성자직함?: string
  근거법령?: string
  근거법령링크?: string
  대표이미지?: string
  핵심요약?: string[] | string
  대상?: string
  부제?: string
  독자?: string
  얻는것?: string
  키워드?: string
  갱신노트?: string
  자가진단?: string
  시리즈?: string
  회차?: string | number
  CTA유형?: string
}

function asDate(v: string | Date | undefined): string {
  if (!v) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v).slice(0, 10)
}

function asTags(v: string[] | string | undefined): string[] {
  if (!v) return []
  if (Array.isArray(v)) return v.map(String)
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export type MarkdownPost = {
  meta: PostMeta
  html: string
  /** 본문 중간에 CTA를 끼워 넣기 위해 나눠 둔 앞·뒤 조각 */
  htmlHead: string
  htmlTail: string
  toc: TocItem[]
  faqs: FaqItem[]
  plainText: string
}

const FAQ_HEADING = /(자주\s*묻는\s*질문|자주하는\s*질문|FAQ|Q\s*&\s*A)/i


/**
 * 글쓴이가 쉽게 쓸 수 있는 예시 블록 문법.
 *
 *   :::예시 30인 미만 제조업이라면
 *   상시근로자 18명 사업장에서 ...
 *   :::
 *
 * 실제 상담 사례가 없어도 "이런 경우엔 이렇게 됩니다" 형태로 기준을 보여줄 수 있다.
 * 가정한 상황임을 화면에 분명히 밝혀 실제 사건으로 오해되지 않게 한다.
 */
const CALLOUT_TYPES: Record<string, { cls: string; label: string }> = {
  예시: { cls: 'example-box', label: '예로 들면 이렇게 됩니다' },
  주의: { cls: 'warn-box', label: '이 점은 주의하세요' },
  /**
   * 주의 상자와 성격이 다르다. 주의는 「이러지 마십시오」라는 경고고,
   * 이것은 「이건 아마 모르실 겁니다」라는 정보다. 경고는 누구나 할 수
   * 있지만 남들이 안 짚는 예외를 짚는 것은 아는 사람만 한다. 그래서
   * 이 상자가 글 한 편에서 전문성을 가장 크게 드러낸다.
   */
  포인트: { cls: 'point-box', label: '놓치기 쉬운 것' },
}

function renderCallouts(
  md: string,
  render: (s: string) => string,
  defaultMember = ''
): { md: string; slots: Map<string, string> } {
  const slots = new Map<string, string>()
  let i = 0

  const out = md.replace(
    /^:::(예시|주의|포인트|엔지니어)[ \t]*(.*)$([\s\S]*?)^:::[ \t]*$/gm,
    (_all, kind: string, title: string, body: string) => {
      const token = `@@CALLOUT_${i}@@`
      i += 1
      const inner = render(body.trim())
      const heading = title.trim()

      if (kind === '엔지니어') {
        // 코멘트 내용은 반드시 텍스트로 남긴다.
        // 이미지로 만들면 검색엔진과 AI가 읽지 못해 가장 중요한 부분이 사라진다.
        // 이름을 비우면 그 글의 담당자가 말한다.
        // 담당은 글마다 돌아가므로, 이름을 박아 두면 글쓴이와 어긋난다.
        const name = heading || defaultMember
        const info = member(name)
        const face = info.photo
          ? (() => {
              const 크기 = imageSize(info.photo)
              const 자리 = 크기 ? ` width="${크기.w}" height="${크기.h}"` : ''
              return `<img src="${imageSrc(info.photo)}"${자리} alt="" loading="lazy" decoding="async" />`
            })()
          : `<span class="member-initial" aria-hidden="true">${name.slice(0, 1)}</span>`
        slots.set(
          token,
          `<aside class="member-note">` +
            `<figure class="member-face">${face}` +
            `<figcaption><b>${name}</b><span>${info.title}</span></figcaption>` +
            `</figure>` +
            `<div class="member-bubble">` +
              `<p class="member-label">엔지니어 한마디</p>` +
              `<div class="callout-body">${inner}</div>` +
            `</div>` +
          `</aside>`
        )
        return `\n\n${token}\n\n`
      }

      const meta = CALLOUT_TYPES[kind]
      slots.set(
        token,
        `<aside class="${meta.cls}">` +
          `<p class="callout-label">${meta.label}</p>` +
          (heading ? `<p class="callout-title">${heading}</p>` : '') +
          `<div class="callout-body">${inner}</div>` +
          `</aside>`
      )
      return `\n\n${token}\n\n`
    }
  )
  return { md: out, slots }
}

/**
 * 마크다운 제목 레벨을 한 단계 낮춰 렌더링한다.
 * 글 제목이 이미 h1이므로 본문의 `#`은 h2가 된다. 노션 백엔드와 동일한 규칙이다.
 */
function normalizeFaqDirectives(md: string): string {
  return md.replace(
    /^:::faq[ \t]*\r?\n([^\r\n]+)\r?\n([\s\S]*?)^:::[ \t]*$/gm,
    (_block, question: string, answer: string) =>
      `## ${question.trim()}\n\n${answer.trim()}`
  )
}

function renderMarkdown(md: string, author = ''): { html: string; toc: TocItem[]; faqs: FaqItem[] } {
  const used = new Set<string>()
  const toc: TocItem[] = []
  let inFaqSection = false
  const marked = new Marked({ gfm: true, breaks: false })

  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens)
        const plain = text.replace(/<[^>]+>/g, '').trim()
        const level = Math.min(depth + 1, 6)
        const id = toAnchorId(plain, used)

        // FAQ 구간에 들어서면 그 아래 질문들은 목차에 넣지 않는다.
        // 접혀 있는 항목으로 가는 링크는 눌러도 내용이 보이지 않아 오히려 혼란스럽다.
        if (level === 2) inFaqSection = FAQ_HEADING.test(plain)

        if (level === 2 || (level === 3 && !inFaqSection)) {
          toc.push({ id, text: plain, level: level as 2 | 3 })
        }
        return `<h${level} id="${id}" class="post-h${level}">${text}</h${level}>\n`
      },
      paragraph({ tokens }) {
        return `<p class="post-p">${this.parser.parseInline(tokens)}</p>\n`
      },
      list(token) {
        const tag = token.ordered ? 'ol' : 'ul'
        const cls = token.ordered ? 'post-ol' : 'post-ul'
        const body = token.items.map((item) => `<li>${this.parser.parse(item.tokens)}</li>`).join('')
        return `<${tag} class="${cls}">${body}</${tag}>\n`
      },
      blockquote({ tokens }) {
        return `<blockquote class="post-quote">${this.parser.parse(tokens)}</blockquote>\n`
      },
      table(token) {
        const head = token.header
          .map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`)
          .join('')
        const rows = token.rows
          .map(
            (row) =>
              `<tr>${row.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`
          )
          .join('')
        // 두 칸짜리 표에는 표시를 남긴다. 좁은 화면에서 가로로 밀지 않고
        // 접어서 담기게 하려는 것인데, 칸 수는 CSS 로 셀 수 없어 여기서 붙인다.
        const 두칸 = token.header.length === 2 ? ' post-table-2' : ''
        return `<div class="post-table-wrap"><table class="post-table${두칸}"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>\n`
      },
      image({ href, text }) {
        // 크기를 적어 두면 그림이 오기 전에 자리를 잡아 아래 글자가 밀리지 않는다.
        const 크기 = imageSize(href)
        const 자리 = 크기 ? ` width="${크기.w}" height="${크기.h}"` : ''
        const { srcSet, sizes } = srcSet2(href)
        const 여러장 = srcSet ? ` srcset="${srcSet}" sizes="${sizes}"` : ''
        return `<figure class="post-figure"><img src="${imageSrc(href)}"${자리}${여러장} alt="${text || ''}" loading="lazy" decoding="async" />${
          text ? `<figcaption>${text}</figcaption>` : ''
        }</figure>\n`
      },
      hr() {
        return '<hr class="post-hr" />\n'
      },
      codespan({ text }) {
        return `<code class="inline-code">${text}</code>`
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens)
        const external = isExternalHref(href)
        const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : ''
        return `<a href="${href}"${title ? ` title="${title}"` : ''}${attrs}>${text}</a>`
      },
    },
  })

  // 예시 블록은 안쪽 내용을 따로 렌더링한 뒤 자리표시자로 바꿔 두었다가 마지막에 되돌린다.
  const sub = new Marked({ gfm: true, breaks: false })
  const normalized = normalizeFaqDirectives(md)
  const { md: prepared, slots } = renderCallouts(
    normalized,
    (s) => sub.parse(s, { async: false }) as string,
    author
  )

  let html = toFaqAccordion(marked.parse(prepared, { async: false }) as string)
  for (const [token, block] of slots) {
    html = html.replace(new RegExp(`<p class="post-p">\\s*${token}\\s*</p>`), block).replace(token, block)
  }

  const faqs = extractFaqFromMarkdown(normalized)
  return { html, toc, faqs }
}

/**
 * FAQ 구간을 클릭해 여닫는 형태로 바꾼다.
 *
 * <details>는 자바스크립트 없이 동작하고, 접혀 있어도 답변 텍스트가 HTML에 그대로
 * 남는다. 구글 FAQ 리치결과와 AI 검색 인용에 필요한 조건이다.
 */
function toFaqAccordion(html: string): string {
  const h2s = [...html.matchAll(/<h2 id="([^"]*)" class="post-h2">([\s\S]*?)<\/h2>/g)]
  const faqH2 = h2s.find((m) => FAQ_HEADING.test(m[2].replace(/<[^>]+>/g, '')))
  if (!faqH2 || faqH2.index === undefined) return html

  const start = faqH2.index + faqH2[0].length
  const after = html.slice(start)

  // FAQ 다음에 또 다른 대제목이 있으면 거기까지만 바꾼다.
  const nextH2 = after.search(/<h2 /)
  const region = nextH2 >= 0 ? after.slice(0, nextH2) : after
  const rest = nextH2 >= 0 ? after.slice(nextH2) : ''

  const parts = [...region.matchAll(/<h3 id="([^"]*)" class="post-h3">([\s\S]*?)<\/h3>/g)]
  if (parts.length === 0) return html

  let items = ''
  for (let i = 0; i < parts.length; i += 1) {
    const m = parts[i]
    if (m.index === undefined) continue
    const bodyStart = m.index + m[0].length
    const bodyEnd = i + 1 < parts.length ? (parts[i + 1].index as number) : region.length
    const answer = region.slice(bodyStart, bodyEnd).trim()
    items +=
      `<details class="faq-item" id="${m[1]}">` +
      `<summary class="faq-q">${m[2]}</summary>` +
      `<div class="faq-a">${answer}</div>` +
      `</details>`
  }

  return html.slice(0, start) + `<div class="faq-list">${items}</div>` + rest
}

/**
 * "## 자주 묻는 질문" 아래의 소제목·답변 쌍을 FAQ로 인식한다.
 * 마크다운에서는 토글이 없으므로 한 단계 아래 제목을 질문으로 본다.
 */
function extractFaqFromMarkdown(md: string): FaqItem[] {
  const lines = md.split(/\r?\n/)
  const out: FaqItem[] = []
  let inFaq = false
  let faqLevel = 0
  let question = ''
  let answer: string[] = []

  const flush = () => {
    const a = answer.join(' ').replace(/\s+/g, ' ').trim()
    if (question && a) out.push({ question, answer: a })
    question = ''
    answer = []
  }

  for (const raw of lines) {
    const m = raw.match(/^(#{1,6})\s+(.*)$/)
    if (m) {
      const level = m[1].length
      const text = m[2].trim()
      if (!inFaq) {
        if (FAQ_HEADING.test(text)) {
          inFaq = true
          faqLevel = level
        }
        continue
      }
      // FAQ 섹션과 같거나 상위 레벨의 제목이 나오면 섹션이 끝난 것이다.
      if (level <= faqLevel) {
        flush()
        inFaq = FAQ_HEADING.test(text)
        faqLevel = level
        continue
      }
      flush()
      question = text.replace(/[*_`]/g, '')
      continue
    }
    if (inFaq && question) {
      const t = raw.replace(/^[-*>\s]+/, '').trim()
      if (t) answer.push(t.replace(/[*_`]/g, ''))
    }
  }
  flush()
  return out
}

/**
 * 긴 글은 끝까지 읽는 사람이 절반도 되지 않는다.
 * 가운데 제목 앞에서 본문을 잘라 CTA를 한 번 더 넣는다.
 * 섹션이 4개 미만이면 굳이 나누지 않는다.
 */
function splitForMidCta(html: string): [string, string] {
  const positions: number[] = []
  const re = /<h2\s/g
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) positions.push(m.index)
  if (positions.length < 4) return [html, '']
  const at = positions[Math.floor(positions.length / 2)]
  return [html.slice(0, at), html.slice(at)]
}

/**
 * 예상 읽는 시간(분).
 *
 * 한글은 낱자가 아니라 어절 단위로 읽히지만, 이 글들은 법령·숫자가 많아 천천히 읽힌다.
 * 분당 500자로 잡는다. 표와 목록은 훑고 지나가므로 본문만 센다.
 * 1분 미만은 1분으로 올린다. '0분'은 표시할 이유가 없다.
 */
function readingMinutes(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*`|:_-]/g, '')
    .replace(/\s+/g, '')
  return Math.max(1, Math.round(text.length / 500))
}

function toMeta(fm: FrontMatter, fallbackSlug: string, fileMtime: Date, body = ''): PostMeta {
  const title = (fm.제목 || '').trim()
  const slug = toSlug(fm.슬러그 || title || fallbackSlug)
  // 담당자는 태그에 못박힌 사람이 있으면 그 사람, 없으면 글 주소로 정해진다.
  // 여럿에게 흩어지되 같은 글은 언제 빌드해도 늘 같은 사람이다.
  const tags = asTags(fm.태그)
  const owner =
    (fm.작성자 || '').trim() ||
    resolveOwner((fm.카테고리 || '').trim(), (fm.대상 || '').trim() || undefined, slug, tags)
  return {
    id: `md:${fallbackSlug}`,
    slug,
    title,
    summary: (fm.요약 || '').trim(),
    category: (fm.카테고리 || '').trim(),
    tags,
    publishedAt: asDate(fm.발행일) || fileMtime.toISOString().slice(0, 10),
    updatedAt: asDate(fm.최종수정일) || asDate(fm.발행일) || fileMtime.toISOString().slice(0, 10),
    // 작성자를 비워두면 카테고리·대상에 맞는 담당자가 자동으로 들어간다.
    // 1,000편을 옮길 때 한 편씩 지정하지 않아도 되게 하기 위함이다.
    author: owner,
    // 직함은 명부를 우선한다. 팀장·대표처럼 사람마다 다르므로
    // 글마다 적는 것보다 명부 한 곳에서 관리하는 편이 정확하다.
    authorTitle: member(owner).title || (fm.작성자직함 || '').trim(),
    lawName: (fm.근거법령 || '').trim(),
    lawUrl: (fm.근거법령링크 || '').trim(),
    coverImage: (fm.대표이미지 || '').trim(),
    // 본문에서 표지 줄을 떼어낼 때 채운다(readMarkdownPosts).
    coverAlt: '',
    keyPoints: asTags(fm.핵심요약),
    // 글머리에 "이 글은 누구를 위한 글인가"를 못박는다.
    // 타겟이 뚜렷해야 문장이 뚜렷해지고, AI 검색이 인용할 때도
    // "요양원 시설장이라면" 같은 조건을 그대로 가져간다.
    reader: (fm.독자 || '').trim(),
    subtitle: (fm.부제 || '').trim(),
    // 담당자를 정할 때만 쓰던 값인데, 글 끝 문단도 이 값으로 갈린다.
    target: (fm.대상 || '').trim(),
    gain: (fm.얻는것 || '').trim(),
    // 구글시트 MAP 과 글을 잇는 열쇠. 시트가 이 값으로 글 주소를 찾아간다.
    keyword: (fm.키워드 || '').trim(),
    readingMinutes: readingMinutes(body),
    // 법령과 금액이 자주 바뀌는 분야다. 언제 무엇을 확인했는지 밝히는 것이
    // 읽는 사람에게는 신뢰 신호이고, 검색엔진에는 최신성 신호가 된다.
    updateNote: (fm.갱신노트 || '').trim(),
    // 순서 있는 묶음. 낱개 글이 흩어지지 않게 하고, 한 편을 읽으면 다음 편으로 이어진다.
    series: (fm.시리즈 || '').trim(),
    seriesNo: Number(fm.회차) || 0,
    // 비워 두면 자가진단 상자가 나오지 않는다. 주제가 맞는 글에서만 켠다.
    tool: String(fm.자가진단 ?? '').trim().replace(/^(true|예)$/i, '예'),
    cta: (fm.CTA유형 || '').trim() || '채팅상담',
    status: (fm.상태 || '').trim() || '초안',
  }
}

let cache: MarkdownPost[] | null = null

/** 발행 상태인 마크다운 글을 최신순으로 읽는다. */
export function readMarkdownPosts(): MarkdownPost[] {
  if (cache) return cache
  if (!hasMarkdownPosts()) {
    cache = []
    return cache
  }

  const files = 글파일들()
  const posts: MarkdownPost[] = []
  const seen = new Set<string>()

  for (const file of files) {
    const full = path.join(POSTS_DIR, file)
    const raw = fs.readFileSync(full, 'utf-8')
    const { data, content } = matter(raw)
    const fm = data as FrontMatter

    const status = (fm.상태 || '').trim()
    const visible = fm.노출 !== false
    // 운영 빌드에는 '발행'만 나간다.
    // 개발 서버에서는 검수·초안도 보여야 발행 전에 화면을 확인할 수 있다.
    if (!visible) continue
    if (status !== '발행' && !SHOW_DRAFTS) continue

    // 폴더 안의 글이면 경로가 아니라 파일 이름만 쓴다.
    const base = path.basename(file).replace(/\.md$/, '')
    const meta = toMeta(fm, base, fs.statSync(full).mtime, content)
    if (!meta.title) continue

    // 슬러그 충돌 방지
    if (seen.has(meta.slug)) {
      let n = 2
      while (seen.has(`${meta.slug}-${n}`)) n += 1
      meta.slug = `${meta.slug}-${n}`
    }
    seen.add(meta.slug)

    // 대표이미지는 글 상단에 따로 크게 보여주므로, 본문에서 같은 이미지를 한 번 더 내보내지 않는다.
    let bodyMd = content
    if (meta.coverImage) {
      const lines = bodyMd.split('\n')
      const dup = lines.findIndex(
        (l) => l.trimStart().startsWith('![') && l.includes(`](${meta.coverImage})`)
      )
      if (dup >= 0) {
        // 줄을 지우기 전에 대괄호 안의 설명을 건져 둔다. 표지를 위쪽에 따로
        // 그리면서 이 설명을 안 넘기면 alt 가 빈 채로 나간다.
        meta.coverAlt = (/!\[([^\]]*)\]/.exec(lines[dup])?.[1] ?? '').trim()
        lines.splice(dup, 1)
        bodyMd = lines.join('\n')
      }
    }

    const { html, toc, faqs } = renderMarkdown(bodyMd, meta.author)
    const [htmlHead, htmlTail] = splitForMidCta(html)
    const plainText = content.replace(/[#*`>_\-|]/g, ' ').replace(/\s+/g, ' ').trim()
    posts.push({ meta, html, htmlHead, htmlTail, toc, faqs, plainText })
  }

  posts.sort((a, b) => (a.meta.publishedAt < b.meta.publishedAt ? 1 : -1))
  cache = posts
  return cache
}

/** 요약이 비어 있을 때 쓸 첫 문단. */
export function firstParagraphOf(post: MarkdownPost): string {
  const m = post.plainText.match(/^(.{20,400}?[.!?])\s/)
  return m ? m[1] : post.plainText.slice(0, 200)
}

/**
 * 자주 묻는 질문 구간을 본문에서 떼어낸다.
 *
 * 글 끝에 붙어 있으면 본문을 다 읽은 사람이 문의 버튼을 만나기 전에 질문
 * 열댓 줄을 더 지나야 한다. 그래서 문의와 작성 정보를 먼저 두고 FAQ는
 * 「함께 읽으면 좋은 글」 바로 위로 내린다.
 *
 * 떼어낸 뒤에도 같은 마크업을 그대로 쓴다. FAQ 스타일과 구조화 데이터는
 * 본문 안쪽에 묶여 있지 않아 자리를 옮겨도 달라지지 않는다.
 */
/**
 * 마지막 자주 묻는 질문이 상담 요청이면 그 답을 떼어 낸다.
 *
 * 글마다 마지막 질문을 「저희 경우 봐 주실 수 있나요」로 맺어 왔는데, 그 답이
 * 「무엇을 알려 주시면 무엇을 짚어 드립니다」라 사실상 그 글에 딱 맞는 CTA
 * 문구다. 좋은 문장을 페이지 맨 아래 접힌 채로 두고, 정작 버튼 옆에는 238편
 * 공통 문구를 두고 있었다.
 *
 * 떼어 낸 것은 자주 묻는 질문에서 뺀다. 버튼 옆과 그 아래에서 같은 말을 두 번
 * 하면 사는 쪽이 지친다. 구조화 데이터에서도 빠지는데 그편이 낫다. 상담 요청은
 * 정보성 질문이 아니라서 FAQ 스키마에 들어갈 자리가 아니다.
 *
 * 마지막 질문이 정보성이면 아무것도 건드리지 않는다.
 */
const 상담요청 = /(주실 수 있나요|주실수 있나요|봐 주시|도와주실)/

export function pullConsultAsk(html: string): { faq: string; ask: string } {
  const 항목 = [...html.matchAll(/<details class="faq-item"[\s\S]*?<\/details>/g)]
  const 끝 = 항목[항목.length - 1]
  if (!끝 || 끝.index === undefined) return { faq: html, ask: '' }

  const 덩어리 = 끝[0]
  const 물음 = /<summary class="faq-q">([\s\S]*?)<\/summary>/.exec(덩어리)
  const 답 = /<div class="faq-a">([\s\S]*?)<\/div>/.exec(덩어리)
  if (!물음 || !답) return { faq: html, ask: '' }
  if (!상담요청.test(물음[1].replace(/<[^>]+>/g, ''))) return { faq: html, ask: '' }

  const ask = 답[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  if (!ask) return { faq: html, ask: '' }

  return {
    faq: html.slice(0, 끝.index) + html.slice(끝.index + 덩어리.length),
    ask,
  }
}

/** 구조화 데이터에서도 같은 질문을 뺀다. 화면과 스키마가 어긋나면 안 된다. */
export function dropConsultFaq(faqs: FaqItem[]): FaqItem[] {
  const 끝 = faqs[faqs.length - 1]
  if (끝 && 상담요청.test(끝.question)) return faqs.slice(0, -1)
  return faqs
}

/**
 * 본문의 주의 상자를 떼어 낸다. 글 끝 「마지막으로 짚을 것」에 합치기 위해서다.
 *
 * 한 화면에 테두리 있는 상자가 둘 나오면 둘 다 흘려 읽힌다. 본문의 주의 상자는
 * 이 글에서 조심할 것을 적은 자리이고 글 끝 상자는 실무에서 어디가 어려운지를
 * 적은 자리인데, 읽는 쪽에서 보면 같은 말을 두 번 하는 것으로 보였다.
 *
 * 합치면 「이 글에서 조심할 것 → 실무에서 갈리는 곳 → 그래서 무엇을 봐 드리는지」
 * 가 한 흐름으로 이어진다. 그 끝이 바로 상담 버튼이다.
 *
 * 245편 중 230편이 주의 상자를 하나씩 갖고 있고 둘 이상인 글은 없다.
 * 없는 글에서는 아무것도 떼지 않고 글 끝 상자만 나온다.
 */
const 주의상자 =
  /<aside class="warn-box"><p class="callout-label">[^<]*<\/p>(?:<p class="callout-title">([\s\S]*?)<\/p>)?<div class="callout-body">([\s\S]*?)<\/div><\/aside>/

export type WarnBox = { title: string; body: string }

export function pullWarnBox(html: string): { html: string; warn: WarnBox | null } {
  const m = 주의상자.exec(html)
  if (!m) return { html, warn: null }
  return {
    html: html.slice(0, m.index) + html.slice(m.index + m[0].length),
    warn: { title: (m[1] ?? '').trim(), body: m[2].trim() },
  }
}

export function splitFaq(html: string): { faq: string; rest: string } {
  const h2s = [...html.matchAll(/<h2 id="([^"]*)" class="post-h2">([\s\S]*?)<\/h2>/g)]
  const found = h2s.find((m) => FAQ_HEADING.test(m[2].replace(/<[^>]+>/g, '')))
  if (!found || found.index === undefined) return { faq: '', rest: html }

  const start = found.index
  const bodyStart = start + found[0].length
  // FAQ 다음에 또 다른 대제목이 있으면 거기부터는 본문에 남긴다.
  const nextH2 = html.slice(bodyStart).search(/<h2 /)
  const end = nextH2 >= 0 ? bodyStart + nextH2 : html.length

  return { faq: html.slice(start, end), rest: html.slice(0, start) + html.slice(end) }
}

