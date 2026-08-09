#!/usr/bin/env node
/**
 * 글을 사이트에 올린다.
 *
 *   npm run 올리기
 *   npm run 올리기 -- "사내근로복지기금 전수점검 글 추가"
 *
 * 하는 일은 셋이다.
 *
 *   1. 좁은 화면용 그림을 만든다 (파이썬이 있을 때만)
 *   2. 글을 검사한다. 실패가 있으면 여기서 멈춘다
 *   3. 저장소에 올린다
 *
 * **검사에 실패하면 올리지 않는다.** 제목이 비었거나 구조가 없는 글이
 * 그대로 나가는 것을 막는 것이 이 명령의 가장 큰 쓸모다.
 *
 * 올리는 것은 `content` 와 `docs` 뿐이다. 코드까지 함께 올리면 글을
 * 올린다고 친 명령이 손대던 코드를 같이 내보내게 된다.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const 올릴것 = ['content', 'docs']

const 로그 = (m) => console.log(m)
const 줄 = () => console.log('─'.repeat(58))

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf-8' }).trim()
}

function 돌리기(cmd, args, { 조용히 = false } = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 조용히 ? 'pipe' : 'inherit', shell: true })
  return r.status === 0
}

/* 1. 좁은 화면용 그림 ------------------------------------------------ */

줄()
로그('1. 좁은 화면용 그림을 만듭니다')
const 파이썬 = ['python', 'py', 'python3'].find((c) =>
  spawnSync(c, ['--version'], { stdio: 'pipe', shell: true }).status === 0
)
if (!파이썬) {
  로그('   파이썬이 없어 건너뜁니다. 원본 그림만 나가고 화면은 정상입니다.')
} else if (!돌리기(파이썬, ['scripts/make-image-variants.py'])) {
  로그('   만들지 못했습니다. 원본 그림만 나가고 화면은 정상입니다.')
}

/* 2. 검사 ------------------------------------------------------------ */

줄()
로그('2. 글을 검사합니다')
if (!돌리기('node', ['scripts/seo-check.mjs', '발행'])) {
  줄()
  로그('검사에 실패한 글이 있어 올리지 않았습니다.')
  로그('위에 [ 실패 ]로 표시된 항목을 고친 뒤 다시 실행하십시오.')
  process.exit(1)
}

/* 3. 올리기 ---------------------------------------------------------- */

줄()
로그('3. 저장소에 올립니다')

const 있는것 = 올릴것.filter((d) => fs.existsSync(path.join(ROOT, d)))
git('add', '--', ...있는것)

const 바뀐것 = git('diff', '--cached', '--name-status')
if (!바뀐것) {
  로그('   바뀐 글이 없습니다. 올릴 것이 없습니다.')
  process.exit(0)
}

로그('')
for (const line of 바뀐것.split('\n')) {
  const [표, ...나머지] = line.split('\t')
  const 이름 = { A: '새 글', M: '고침', D: '지움', R: '이름 바꿈' }[표[0]] ?? 표
  로그(`   ${이름}  ${나머지.join(' ')}`)
}
로그('')

const 메시지 = process.argv.slice(2).join(' ').trim() || '글 올림'
git('commit', '-m', 메시지)

const 브랜치 = git('rev-parse', '--abbrev-ref', 'HEAD')
git('push', 'origin', `${브랜치}:main`)
git('push', 'origin', `${브랜치}:review`)

줄()
로그('올렸습니다. 2~3분 뒤 사이트에 반영됩니다.')
로그('   운영    https://blog.dowonhr.com/blog/')
로그('   검토용  https://review-dowon-blog.choim-249.workers.dev/blog/')
로그('')
로그('상태가 「검수」인 글은 검토용에만 보입니다.')
