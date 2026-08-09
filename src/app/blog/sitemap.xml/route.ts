import { categorySlug, listCategories, listPosts } from '@/lib/content'
import { PER_PAGE } from '@/components/PostList'
import { categoryUrl, listUrl, pageUrl, postUrl, sectionUrl } from '@/lib/seo'
import { MEMBERS } from '@/config/site'

export const dynamic = 'force-static'

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * /blog/sitemap.xml
 * 글뿐 아니라 목록·카테고리 페이지까지 넣는다.
 * 카테고리 페이지는 그 자체로 "산업재해 노무" 같은 분류성 검색어를 노린다.
 */
export async function GET() {
  const posts = await listPosts()
  const categories = await listCategories()
  const latest = posts[0]?.updatedAt || posts[0]?.publishedAt || ''

  type Entry = { loc: string; lastmod: string; priority: string }
  const urls: Entry[] = []

  // 목록과 그 뒷쪽들
  const listPages = Math.max(1, Math.ceil(posts.length / PER_PAGE))
  for (let n = 1; n <= listPages; n += 1) {
    urls.push({ loc: n === 1 ? listUrl() : pageUrl(n), lastmod: latest, priority: n === 1 ? '0.9' : '0.5' })
  }

  // 카테고리와 그 뒷쪽들
  for (const c of categories) {
    const slug = categorySlug(c.name)
    const inCat = posts.filter((p) => p.category === c.name)
    const catPages = Math.max(1, Math.ceil(inCat.length / PER_PAGE))
    const catLast = inCat[0]?.updatedAt || inCat[0]?.publishedAt || latest
    for (let n = 1; n <= catPages; n += 1) {
      urls.push({
        loc: categoryUrl(slug, n),
        lastmod: catLast,
        priority: n === 1 ? '0.8' : '0.4',
      })
    }
  }

  // 고정 페이지. 노무사 페이지는 사람 이름 검색을 받는다.
  urls.push({ loc: sectionUrl('members'), lastmod: latest, priority: '0.6' })

  for (const name of Object.keys(MEMBERS)) {
    const mine = posts.filter((x) => x.author === name)
    if (mine.length === 0) continue
    urls.push({
      loc: sectionUrl('members', name),
      lastmod: mine[0]?.updatedAt || mine[0]?.publishedAt || latest,
      priority: '0.5',
    })
  }

  // 글
  for (const p of posts) {
    urls.push({ loc: postUrl(p.slug), lastmod: p.updatedAt || p.publishedAt, priority: '0.7' })
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${esc(u.loc)}</loc>
    <lastmod>${(u.lastmod || '').slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
