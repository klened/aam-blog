#!/usr/bin/env node
/**
 * 발행 전 SEO 점검기.
 * 규칙 문서의 체크리스트를 자동으로 검사한다. 노션과 마크다운 양쪽을 지원한다.
 *
 *   npm run seo:check            발행 상태인 글 검사
 *   npm run seo:check -- 검수     상태가 '검수'인 글 검사
 *   npm run seo:check -- 전체     상태와 무관하게 전부 검사
 */

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import matter from 'gray-matter'
import { 검사하기 } from './문체검사.mjs'

const TOKEN = process.env.NOTION_TOKEN
const DB = process.env.NOTION_DATABASE_ID
const WANT = process.argv[2] || '발행'
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts')

const AD_WORDS = /(무료상담|최대\s*\d|절감|알아봅시다|완벽\s*정리|총정리|모든\s*것|국세청\s*10년)/
const GREETING = /^(안녕하세요|반갑습니다|오늘은|이번\s*시간)/

/* ───────────────────────── 공통 검사 로직 ───────────────────────── */

/**
 * 화면에 별표가 그대로 나가는 자리를 찾는다.
 *
 * 닫는 `**` 앞이 문장부호이고 뒤에 글자가 붙으면 마크다운이 강조를 닫지
 * 못한다. 별표 두 개가 글자로 그대로 나간다. 눈으로는 잘 안 보이고
 * 빌드도 통과해서, 글 여섯 편이 이 상태로 발행된 적이 있다.
 *
 * 처음에는 닫는 괄호와 낫표만 봤는데 `**3.1%**입니다` 를 놓쳤다.
 * 퍼센트도 부호라 같은 일이 벌어진다. 그래서 부호를 넓혀 두었다.
 *
 * 고치는 방법은 별표를 안쪽으로 옮기는 것이다.
 *   깨짐  **「회사가 어렵다」**는     →  고침  「**회사가 어렵다**」는
 *   깨짐  **[다른 글](/blog/x/)**가  →  고침  [**다른 글**](/blog/x/)가
 *   깨짐  **3.1%**입니다             →  고침  **의무고용률은 3.1%입니다**
 */
function 깨진강조(body) {
  const 부호 = `」』】〕》〉)\\]}%.,!?;:'"’”·`
  const 찾기 = new RegExp(`\\*\\*[^*\\n]*[${부호}]\\*\\*(?=[가-힣A-Za-z0-9])`, 'g')
  return (body.match(찾기) || []).map((s) => (s.length > 34 ? s.slice(0, 32) + '…' : s))
}

/**
 * 표지 그림의 설명(alt)을 찾는다.
 *
 * 대표이미지와 같은 그림이 본문 첫머리에 한 번 더 적혀 있으면, 화면을 그릴 때
 * 그 줄을 떼어 위쪽 표지 자리로 옮긴다. 그때 대괄호 안의 설명도 함께 간다.
 * 그래서 이 줄이 없거나 대괄호가 비어 있으면 표지가 alt 없이 나간다.
 *
 * 실제로 글 93편이 이 상태로 나가고 있었다. 눈으로는 안 보이고 빌드도
 * 통과해서 아무도 몰랐다. 화면을 못 보는 사람에게는 그림이 없는 것과 같고,
 * 검색엔진도 그림이 무엇인지 읽지 못한다.
 */
function 표지설명(body, coverImage) {
  if (!coverImage) return null            // 표지가 없으면 잴 것도 없다
  // 주소에 괄호나 점이 들어가므로 정규식에서 뜻을 잃도록 앞에 역슬래시를 붙인다.
  const 그대로 = coverImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = new RegExp(`^\\s*!\\[([^\\]]*)\\]\\(${그대로}\\)`, 'm').exec(body)
  if (!m) return ''                       // 줄이 아예 없다
  return m[1].trim()
}

function inspect({ title, summary, law, firstText, sectionCount, bodyLen, brokenBold, coverAlt }) {
  const r = []
  const add = (level, label, detail = '') => r.push({ level, label, detail })

  if (!title) add('fail', '제목이 비어 있습니다')
  else if (title.length > 32) add('warn', `제목이 ${title.length}자입니다`, '32자 이내를 권장합니다')

  if (title.includes('|'))
    add('fail', '제목에 파이프(|) 나열이 있습니다', '색인 탈락 글의 75%가 이 패턴이었습니다')
  if (AD_WORDS.test(title))
    add('warn', '제목에 광고성 표현이 있습니다', title.match(AD_WORDS)?.[0])

  if (!firstText) {
    add('fail', '본문 첫 문단을 찾지 못했습니다')
  } else {
    if (GREETING.test(firstText))
      add('fail', '첫 문단이 인사말로 시작합니다', '검색결과 설명문이 인사말로 채워집니다')
    const firstSentence = firstText.split(/(?<=[.!?])\s/)[0] || firstText
    if (firstSentence.length < 40 || firstSentence.length > 160)
      add('warn', `첫 문장이 ${firstSentence.length}자입니다`, '80~120자를 권장합니다')
    if (!/\d/.test(firstText))
      add('warn', '첫 문단에 숫자가 없습니다', '수치가 있으면 검색결과에서 눈에 띕니다')
  }

  if (!summary) add('warn', '요약이 비어 있습니다', '비우면 첫 문단이 자동으로 쓰입니다')
  if (sectionCount < 2)
    add('warn', `섹션 제목이 ${sectionCount}개입니다`, '개수를 맞출 필요는 없지만 최소한의 구조는 필요합니다')
  if (!law) add('warn', '근거 법령이 비어 있습니다')
  if (bodyLen < 1500) add('warn', `본문이 ${bodyLen.toLocaleString()}자입니다`, '1,500자 이상을 권장합니다')

  for (const 자리 of brokenBold ?? [])
    add('fail', '별표가 화면에 그대로 나갑니다', `${자리} — 별표를 괄호 안쪽으로 옮기십시오`)

  if (coverAlt === '')
    add('fail', '표지 그림에 설명이 없습니다', '본문 첫머리에 ![설명](대표이미지) 줄을 두십시오')
  else if (coverAlt && coverAlt.length < 10)
    add('warn', `표지 설명이 ${coverAlt.length}자입니다`, '그림에 무엇이 보이는지 한 문장으로 적으십시오')

  return r
}

/* ───────────────────────── 마크다운 백엔드 ───────────────────────── */

/** 글 파일을 모은다. `{슬러그}/{슬러그}.md` 와 `{슬러그}.md` 를 함께 읽는다. */
function 글파일들(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if (d.isFile() && d.name.endsWith('.md')) out.push(d.name)
    else if (d.isDirectory()) {
      for (const f of fs.readdirSync(path.join(dir, d.name))) {
        if (f.endsWith('.md')) out.push(path.join(d.name, f))
      }
    }
  }
  return out.sort()
}

function fromMarkdown() {
  if (!fs.existsSync(POSTS_DIR)) return []
  return 글파일들(POSTS_DIR)
    .map((f) => {
      const { data, content } = matter(fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8'))
      const body = content.trim()
      const firstText = (body.split(/\n\s*\n/).find((b) => !b.startsWith('#') && b.length > 20) || '')
        .replace(/[*_`>]/g, '')
        .trim()
      const faqIdx = body.search(/^#{1,3}\s*.*(자주\s*묻는\s*질문|FAQ)/im)
      const faqCount =
        faqIdx < 0 ? 0 : (body.slice(faqIdx).match(/^#{2,4}\s+\S.*$/gm) || []).length - 1
      return {
        source: f,
        status: (data.상태 || '').trim(),
        title: (data.제목 || '').trim(),
        summary: (data.요약 || '').trim(),
        author: (data.작성자 || '').trim(),
        law: (data.근거법령 || '').trim(),
        firstText,
        sectionCount: (body.match(/^#\s+\S/gm) || []).length,
        bodyLen: body.replace(/\s+/g, '').length,
        brokenBold: 깨진강조(body),
        coverAlt: 표지설명(body, (data.대표이미지 || '').trim()),
        hasTable: /^\|.*\|/m.test(body),
        faqCount: Math.max(faqCount, 0),
        body,                                   // 문체 검사가 본문을 쓴다
      }
    })
}

/* ───────────────────────── 노션 백엔드 ───────────────────────── */

const API = 'https://api.notion.com/v1'
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
}

async function api(p, init) {
  const res = await fetch(`${API}${p}`, { headers: HEADERS, ...init })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}
const plain = (rich) => (rich || []).map((x) => x.plain_text).join('').trim()
function prop(props, key) {
  const p = props[key]
  if (!p) return ''
  if (p.type === 'title') return plain(p.title)
  if (p.type === 'rich_text') return plain(p.rich_text)
  if (p.type === 'select') return p.select?.name ?? ''
  if (p.type === 'url') return p.url ?? ''
  return ''
}
function blockText(b) {
  const body = b[b.type]
  return body?.rich_text ? plain(body.rich_text) : ''
}
async function allBlocks(id, depth = 0) {
  if (depth > 2) return []
  const out = []
  let cursor
  do {
    const q = cursor ? `?start_cursor=${cursor}&page_size=100` : '?page_size=100'
    const res = await api(`/blocks/${id}/children${q}`)
    for (const b of res.results) {
      out.push(b)
      if (b.has_children) out.push(...(await allBlocks(b.id, depth + 1)))
    }
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)
  return out
}

async function fromNotion() {
  const pages = []
  let cursor
  do {
    const res = await api(`/databases/${DB}/query`, {
      method: 'POST',
      body: JSON.stringify({ start_cursor: cursor, page_size: 100 }),
    })
    pages.push(...res.results)
    cursor = res.has_more ? res.next_cursor : undefined
  } while (cursor)

  const out = []
  for (const page of pages) {
    const props = page.properties
    const blocks = await allBlocks(page.id)
    const firstPara = blocks.find((b) => b.type === 'paragraph' && blockText(b).length >= 10)
    out.push({
      source: '노션',
      status: prop(props, '상태'),
      title: prop(props, '제목'),
      summary: prop(props, '요약'),
      author: prop(props, '작성자'),
      law: prop(props, '근거법령'),
      firstText: firstPara ? blockText(firstPara) : '',
      sectionCount: blocks.filter((b) => b.type === 'heading_1').length,
      bodyLen: blocks.reduce((n, b) => n + blockText(b).length, 0),
      hasTable: blocks.some((b) => b.type === 'table'),
      faqCount: blocks.filter((b) => b.type === 'toggle').length,
    })
  }
  return out
}

/* ───────────────────────── 문체 검사 ───────────────────────── */

/**
 * 이번에 손댄 글만 고른다.
 *
 * 문체 규칙을 이미 나간 글에 소급하면 264편 가운데 141편이 걸린다. 그러면
 * 발행이 영영 막힌다. 규칙은 앞으로 쓰는 글에만 건다. 예전 글은 고칠 때
 * 같이 걸리므로 시간이 지나면 저절로 줄어든다.
 *
 * -z 를 쓰는 이유는 한글 경로 때문이다. 이것 없이 부르면 git 이 파일명을
 * 여덟진수로 감싸서 내놓아 그대로 비교할 수 없다.
 *
 * -uall 이 없으면 새 글이 파일이 아니라 폴더 하나로 나온다. 새로 쓴 글은
 * 폴더째 새것이라, 이걸 빼먹으면 정작 검사해야 할 글이 통째로 빠진다.
 */
function 손댄글들() {
  try {
    const out = execFileSync('git', ['status', '--porcelain', '-z', '-uall', '--', 'content/posts'], {
      cwd: process.cwd(),
      encoding: 'utf-8',
    })
    const set = new Set()
    for (const 조각 of out.split('\0')) {
      if (조각.length < 4) continue
      const 경로 = 조각.slice(3).replace(/^content\/posts\//, '')
      if (경로.endsWith('.md')) set.add(경로)
    }
    return set
  } catch {
    return null // git 이 없으면 문체 검사를 건너뛴다
  }
}

/**
 * 문체 검사 결과를 SEO 검사와 같은 모양으로 바꾼다.
 *
 * A 는 실패로 올려 발행을 막는다. C 는 기계가 못 푸는 자리라 주의로만 둔다.
 * B 는 건수만 알린다. 45자 넘는 문장까지 한 줄씩 찍으면 목록이 본문보다
 * 길어져서 아무도 안 읽는다. 자세히 보려면 문체검사.mjs 를 따로 돌린다.
 */
function 문체결과(body) {
  const r = 검사하기(body)
  const out = []
  const 묶기 = (목록) => {
    const m = new Map()
    for (const it of 목록) {
      if (!m.has(it.규칙)) m.set(it.규칙, { 말: it.말, 대신: it.대신, 예: it.걸린것, 수: 0 })
      m.get(it.규칙).수 += 1
    }
    return m
  }
  for (const [규칙, v] of 묶기(r.A)) {
    out.push({ level: 'fail', label: `문체 · ${v.말}`, detail: `${v.수}건 · 「${v.예}」 → ${v.대신}` })
  }
  for (const [규칙, v] of 묶기(r.C)) {
    out.push({ level: 'warn', label: `문체 · ${v.말}`, detail: `${v.수}건 · 「${v.예}」 → ${v.대신}` })
  }
  if (r.B.length) {
    out.push({ level: 'warn', label: `문체 · 다듬을 곳 ${r.B.length}건`, detail: 'node scripts/문체검사.mjs <파일> 로 자세히 봅니다' })
  }
  return out
}

/* ───────────────────────── 실행 ───────────────────────── */

const LABEL = { pass: '  ok  ', warn: ' 주의 ', fail: ' 실패 ' }

/**
 * 목록 맨 위 표지에 적힌 달을 읽는다.
 *
 * site.ts 는 TypeScript 라 이 스크립트에서 그대로 가져올 수 없다. 값 두 개를
 * 읽으려고 빌드 도구를 끌어들이는 것보다 글자로 찾는 편이 가볍다.
 * 못 찾으면 조용히 넘어간다. 이건 글 검사의 곁가지다.
 */
function readMasthead() {
  try {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/config/site.ts'), 'utf-8')
    const block = /export const MASTHEAD = \{([\s\S]*?)\} as const/.exec(src)
    if (!block) return null
    const issue = /issue:\s*'([^']*)'/.exec(block[1])
    if (!issue) return null
    // 달은 따로 적지 않고 문구에서 찾는다. 값을 두 곳에 두면 한쪽만 고치게 된다.
    // 달을 빼고 쓰면 여기서 null 이 나와 이 검사가 저절로 꺼진다.
    const month = /(\d{1,2})\s*월/.exec(issue[1])
    if (!month) return null
    return { issue: issue[1], month: Number(month[1]) }
  } catch {
    return null
  }
}

async function main() {
  const useNotion = !!(TOKEN && DB)
  console.log(`\n저장소: ${useNotion ? '노션' : '마크다운 파일(content/posts)'}`)
  console.log(`대상: 상태가 '${WANT}'인 글\n`)

  const posts = useNotion ? await fromNotion() : fromMarkdown()
  const targets = WANT === '전체' ? posts : posts.filter((p) => p.status === WANT)

  if (targets.length === 0) {
    console.log('해당 상태의 글이 없습니다.')
    if (posts.length > 0) {
      const counts = posts.reduce((m, p) => ({ ...m, [p.status || '(없음)']: (m[p.status || '(없음)'] || 0) + 1 }), {})
      console.log('현재 상태 분포:', counts)
    }
    return
  }

  let fails = 0
  let warns = 0

  // 문체 검사는 이번에 손댄 글에만 건다. 까닭은 손댄글들() 에 적어 두었다.
  const 손댄 = useNotion ? null : 손댄글들()
  if (손댄) console.log(`문체 검사 대상: 이번에 손댄 글 ${손댄.size}편\n`)

  for (const post of targets) {
    const results = inspect(post)
    // 윈도에서는 글 목록이 역슬래시로 오고 git 은 슬래시로 준다. 맞춰 준다.
    const 경로 = (post.source || '').split(path.sep).join('/')
    if (손댄 && post.body && 손댄.has(경로)) results.push(...문체결과(post.body))
    const f = results.filter((r) => r.level === 'fail')
    const w = results.filter((r) => r.level === 'warn')
    fails += f.length
    warns += w.length

    const mark = f.length ? '✗' : w.length ? '△' : '✓'
    console.log(`${mark} ${post.title || '(제목 없음)'}   [${post.source}]`)
    for (const r of results) console.log(`   [${LABEL[r.level]}] ${r.label}${r.detail ? ` — ${r.detail}` : ''}`)
    if (results.length === 0) console.log('   모든 항목을 통과했습니다.')
    console.log('')
  }

  console.log('─'.repeat(60))
  console.log(`글 ${targets.length}편 검사 완료 · 실패 ${fails}건 · 주의 ${warns}건`)

  // 목록 맨 위 표지에 적힌 달이 지났는지 본다. 글과는 상관없지만 첫 화면에
  // 지난 달이 적혀 있으면 사이트가 방치된 것처럼 보인다. 사람이 매달 고치는
  // 값이라 잊기 쉬워서, 발행 전에 한 번은 눈에 띄게 해 둔다.
  const masthead = readMasthead()
  if (masthead) {
    const now = new Date().getMonth() + 1
    if (masthead.month !== now) {
      console.log('')
      console.log(
        `[ 주의 ] 목록 맨 위가 아직 ${masthead.month}월입니다 — 지금은 ${now}월입니다` +
          `
         src/config/site.ts 의 MASTHEAD 에서 issue 를 고칩니다.` +
          `
         지금 문구: ${masthead.issue}`
      )
    }
  }

  if (fails > 0) process.exitCode = 1
}

main().catch((e) => {
  console.error('\n검사 중 오류가 발생했습니다:', e.message)
  process.exit(1)
})
