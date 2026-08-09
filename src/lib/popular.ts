import fs from 'node:fs'
import path from 'node:path'
import { POPULAR } from '@/config/site'

type 인기글파일 = { 글?: { slug: string; count: number }[] }

/**
 * 조회수 상위 글의 주소를 순서대로 돌려준다.
 *
 * 두 곳에서 가져온다. site.ts 의 POPULAR.slugs 에 손으로 적어 둔 것이 있으면
 * 그게 이긴다. 특정 글을 위에 올려 두고 싶을 때 쓰는 자리다.
 *
 * 없으면 빌드할 때 Cloudflare 에서 받아 적어 둔 content/popular.json 을 읽는다.
 * 그 파일은 scripts/fetch-popular.mjs 가 만들고 저장소에는 넣지 않는다.
 * 토큰이 없는 곳에서 빌드하면 파일이 없고, 그때는 빈 배열이 돌아간다.
 *
 * 빈 배열이면 글 아래에는 같은 주제의 글이 나가고 제목도 「인기」라고 하지
 * 않는다. 없는 숫자로 인기라는 딱지를 붙이지 않기 위해서다.
 */
export function popularSlugs(): string[] {
  if (POPULAR.slugs.length > 0) return POPULAR.slugs

  try {
    const file = path.join(process.cwd(), 'content', 'popular.json')
    const raw = fs.readFileSync(file, 'utf-8')
    const data = JSON.parse(raw) as 인기글파일
    return (data.글 ?? []).map((x) => x.slug).filter(Boolean)
  } catch {
    return []
  }
}
