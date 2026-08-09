/**
 * 쓴 글 목록을 표로 뽑는다.
 *
 * 시트에 손으로 옮겨 적지 않기 위한 것이다. 글 파일이 원본이므로 표는 언제든
 * 여기서 다시 뽑으면 된다. 제목이나 카테고리를 고쳐도 표를 따로 고칠 일이 없다.
 *
 *   npm run 목록
 *
 * 담당 노무사는 대부분의 글에서 `작성자`를 비워 두고 슬러그 해시로 자동
 * 배정하므로 파일만 읽어서는 알 수 없다. 그래서 빌드 결과(out/)가 있으면
 * 거기서 실제로 나간 이름을 읽는다. 없으면 그 칸만 비우고 나머지는 채운다.
 */
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const ROOT = path.resolve(import.meta.dirname, '..')
const POSTS = path.join(ROOT, 'content/posts')
const OUT = path.join(ROOT, 'out/blog')
const BASE = 'https://blog.dowonhr.com/blog'
/** 검수 중인 글은 여기서만 보인다. 검토용 배포에는 색인 차단이 걸려 있다. */
const REVIEW = 'https://review-dowon-blog.choim-249.workers.dev/blog'

const COLUMNS = [
  '카테고리', '대상', '독자', '제목', '요약', '담당',
  '연재', '회차', '상태', '발행일', '최종수정일', '태그', '근거법령', 'URL', '검토용 주소',
]

/** 빌드 결과에서 실제로 나간 담당자 이름을 읽는다. */
function authorFromBuild(slug) {
  const file = path.join(OUT, slug, 'index.html')
  if (!fs.existsSync(file)) return null
  const html = fs.readFileSync(file, 'utf-8')
  const meta = /<p class="post-meta">[\s\S]*?<\/p>/.exec(html)
  if (!meta) return null
  // 「HR팀 조소윤 팀장」처럼 팀과 직책이 붙으므로 이름만 골라낸다.
  const link = /\/노무사\/([^/"]+)\//.exec(decodeURIComponent(meta[0]))
  return link ? link[1] : null
}

function toRow(file) {
  const { data } = matter(fs.readFileSync(path.join(POSTS, file), 'utf-8'))
  const g = (k) => String(data[k] ?? '').trim()
  const slug = g('슬러그') || path.basename(file).replace(/\.md$/, '')
  const tags = Array.isArray(data.태그) ? data.태그.join(' ') : g('태그')
  return [
    g('카테고리'), g('대상'), g('독자'), g('제목'), g('요약'),
    g('작성자') || authorFromBuild(slug) || '',
    g('시리즈'), g('회차'), g('상태'), g('발행일'), g('최종수정일'),
    tags, g('근거법령'), `${BASE}/${slug}/`,
    // 검수 중인 글만 검토용 주소를 적는다. 발행된 글은 위 주소로 보면 된다.
    g('상태') === '발행' ? '' : `${REVIEW}/${slug}/`,
  ]
}

/** 쉼표와 따옴표, 줄바꿈이 들어간 칸을 감싼다. */
function cell(v) {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** `{슬러그}/{슬러그}.md` 와 `{슬러그}.md` 를 함께 읽는다. */
function 글파일들() {
  const out = []
  for (const d of fs.readdirSync(POSTS, { withFileTypes: true })) {
    if (d.isFile() && d.name.endsWith('.md')) out.push(d.name)
    else if (d.isDirectory()) {
      for (const f of fs.readdirSync(path.join(POSTS, d.name))) {
        if (f.endsWith('.md')) out.push(path.join(d.name, f))
      }
    }
  }
  return out.sort()
}

const files = 글파일들()
const rows = files.map(toRow)
// 카테고리로 묶고 그 안에서는 최신 글이 위로 온다.
rows.sort((a, b) => a[0].localeCompare(b[0], 'ko') || b[9].localeCompare(a[9]))

const csv = [COLUMNS, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
const dest = path.join(ROOT, '목록.csv')
// 엑셀이 한글을 깨뜨리지 않도록 BOM을 붙인다.
fs.writeFileSync(dest, '﻿' + csv, 'utf-8')

const byCategory = new Map()
for (const r of rows) byCategory.set(r[0], (byCategory.get(r[0]) ?? 0) + 1)

console.log(`\n글 ${rows.length}편을 ${path.relative(process.cwd(), dest)} 에 적었습니다.\n`)
for (const [c, n] of [...byCategory].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(3)}편  ${c || '(카테고리 없음)'}`)
}
// 검수 중인 글은 주소까지 적어 준다. 탐색기에서는 폴더 이름만 보여서
// 어느 글이 검수 중인지 열어 보기 전에는 알 수 없다.
const drafts = rows.filter((r) => r[8] !== '발행')
if (drafts.length) {
  console.log(`\n  검수 중 ${drafts.length}편 — 검토용에서만 보입니다`)
  for (const r of drafts) {
    console.log(`     ${r[3]}`)
    console.log(`       ${decodeURIComponent(r[14])}`)
  }
}

// 검수 중인 글은 운영 빌드에 없어서 담당자 이름을 읽을 수 없다. 그건 잘못이 아니다.
const 발행중공란 = rows.filter((r) => !r[5] && r[8] === '발행').length
if (발행중공란) {
  console.log(
    `\n  담당자를 채우지 못한 발행 글이 ${발행중공란}편 있습니다.` +
      `\n  npm run build 뒤에 다시 뽑으면 채워집니다.`
  )
}
console.log('')
