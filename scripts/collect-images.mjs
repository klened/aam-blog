#!/usr/bin/env node
/**
 * 글 폴더 안의 그림을 공개 폴더로 옮겨 담는다.
 *
 * 글과 그림은 한 폴더에 둔다. 글 하나를 손볼 때 두 군데를 오갈 일이 없고,
 * 탐색기에서 폴더 하나만 지우면 글과 그림이 함께 지워진다.
 *
 *   content/posts/기금-운영상황보고서/기금-운영상황보고서.md
 *   content/posts/기금-운영상황보고서/1.webp
 *
 * 다만 브라우저가 읽는 것은 public/ 아래뿐이다. 그렇다고 글까지 public/ 에
 * 두면 검수 중인 글의 원문이 주소로 그대로 열린다. 그래서 그림만 옮긴다.
 *
 *   public/images/기금-운영상황보고서/1.webp
 *
 * 이 복사본은 저장소에 넣지 않는다. 빌드할 때마다 다시 만들어지는 것이라
 * 원본과 사본이 어긋날 여지를 남기지 않는다.
 *
 *   npm run build     (prebuild 로 자동 실행)
 *   npm run 이미지모으기
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const POSTS = path.join(ROOT, 'content', 'posts')
const OUT = path.join(ROOT, 'public', 'images')
/** 이 폴더들은 글에 딸린 것이 아니라 사이트가 늘 쓰는 것이라 건드리지 않는다. */
const 지킬것 = new Set(['공통', '노무사'])
const 그림 = /\.(webp|png|jpe?g|gif|svg|avif)$/i

const 로그 = (m) => console.log(`[이미지] ${m}`)

function 같은가(a, b) {
  try {
    const x = fs.statSync(a)
    const y = fs.statSync(b)
    return x.size === y.size && y.mtimeMs >= x.mtimeMs
  } catch {
    return false
  }
}

if (!fs.existsSync(POSTS)) {
  로그('글 폴더가 없어 건너뜁니다.')
  process.exit(0)
}

const 글폴더 = fs
  .readdirSync(POSTS, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)

let 옮김 = 0
let 그대로 = 0
const 낡음 = []
const 살릴폴더 = new Set(지킬것)

for (const 이름 of 글폴더) {
  const 안 = path.join(POSTS, 이름)
  const 그림들 = fs.readdirSync(안).filter((f) => 그림.test(f))
  if (그림들.length === 0) continue

  살릴폴더.add(이름)
  const 목적지 = path.join(OUT, 이름)
  fs.mkdirSync(목적지, { recursive: true })

  for (const f of 그림들) {
    // 원본이 바뀌었는데 줄인 그림이 그대로면 PC와 휴대폰에 다른 그림이 나간다.
    // 그때는 줄인 그림을 아예 내보내지 않는다. 원본 하나만 나가는 편이,
    // 화면 크기에 따라 다른 그림이 보이는 것보다 낫다.
    const m = /^(.*)@480(\.[^.]+)$/.exec(f)
    if (m) {
      const 원본 = path.join(안, m[1] + m[2])
      if (fs.existsSync(원본) && fs.statSync(원본).mtimeMs > fs.statSync(path.join(안, f)).mtimeMs) {
        낡음.push(path.join(이름, f))
        fs.rmSync(path.join(목적지, f), { force: true })
        continue
      }
    }

    const from = path.join(안, f)
    const to = path.join(목적지, f)
    if (같은가(from, to)) {
      그대로 += 1
      continue
    }
    fs.copyFileSync(from, to)
    옮김 += 1
  }
}

// 글이 사라졌는데 그림만 남아 있으면 지운다. 남겨 두면 지운 글의 그림이
// 주소로 계속 열리고, 나중에 왜 있는지 아무도 모르게 된다.
let 치움 = 0
if (fs.existsSync(OUT)) {
  for (const d of fs.readdirSync(OUT, { withFileTypes: true })) {
    if (!d.isDirectory() || 살릴폴더.has(d.name)) continue
    fs.rmSync(path.join(OUT, d.name), { recursive: true, force: true })
    치움 += 1
  }
}

로그(`글 폴더 ${글폴더.length}개 · 옮긴 그림 ${옮김}장 · 그대로 둔 것 ${그대로}장${치움 ? ` · 치운 폴더 ${치움}개` : ''}`)

if (낡음.length > 0) {
  로그('')
  로그(`줄인 그림이 원본보다 오래돼 내보내지 않았습니다 (${낡음.length}장).`)
  로그('원본만 나가므로 화면은 정상이지만, 휴대폰에 큰 파일이 갑니다.')
  로그('  python scripts/make-image-variants.py')
  for (const f of 낡음.slice(0, 5)) 로그(`    ${f}`)
}
