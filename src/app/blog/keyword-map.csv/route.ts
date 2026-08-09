import { listPosts } from '@/lib/content'
import { postUrl } from '@/lib/seo'

export const dynamic = 'force-static'

/**
 * /blog/keyword-map.csv — 키워드와 글 주소를 짝지어 내보낸다.
 *
 * 구글시트 MAP 의 Q열(blog.dowonhr)이 이 파일을 읽어 스스로 주소를 채운다.
 * 시트에 아래 한 줄을 Q2 에 넣어 두면 그 뒤로는 손댈 일이 없다.
 *
 *   =ARRAYFORMULA(IF(K2:K="", "",
 *     IFERROR(VLOOKUP(K2:K,
 *       IMPORTDATA("https://blog.dowonhr.com/blog/keyword-map.csv"), 2, FALSE), "")))
 *
 * 글을 새로 올리면 다음 배포 때 이 파일이 다시 만들어지고, 시트는 알아서
 * 새 주소를 가져간다. 사람이 붙여 넣는 단계가 없으므로 어긋날 일도 없다.
 *
 * 파일 이름에 한글을 쓰지 않는다. IMPORTDATA 에 넣을 주소가 인코딩되면
 * 시트에서 다루기가 번거로워진다.
 */
export async function GET() {
  const posts = await listPosts()

  // 키워드가 비어 있으면 시트와 이을 수가 없다. VLOOKUP 이 빈 칸을 물지
  // 않도록 아예 내보내지 않는다.
  const 줄들 = posts
    .filter((p) => p.keyword)
    // 주소는 한글을 그대로 둔다. 퍼센트로 인코딩하면 시트 칸에서 알아볼 수가
    // 없다. 눌렀을 때 브라우저가 알아서 다시 인코딩하므로 동작에는 지장이 없다.
    .map((p) => [p.keyword, decodeURI(postUrl(p.slug))])
    // 시트에서 눈으로 찾을 일이 생기므로 가나다순으로 둔다.
    .sort((a, b) => a[0].localeCompare(b[0], 'ko'))

  // 키워드에 쉼표가 들어가는 일은 드물지만, 들어가면 열이 밀린다.
  const 칸 = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const body = ['키워드,주소', ...줄들.map((r) => r.map(칸).join(','))].join('\n') + '\n'

  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      // 시트가 하루에도 몇 번씩 물어 온다. 오래 잡아 두면 새 글이 늦게 붙는다.
      'Cache-Control': 'public, max-age=300',
    },
  })
}
