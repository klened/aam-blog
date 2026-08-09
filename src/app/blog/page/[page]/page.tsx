import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { listCategories, listPosts } from '@/lib/content'
import { SITE } from '@/config/site'
import { pageUrl } from '@/lib/seo'
import { ChannelTalk } from '@/components/ChannelTalk'
import { CategoryNav } from '@/components/CategoryNav'
import { PostList, PER_PAGE, paginate } from '@/components/PostList'

type Params = { params: Promise<{ page: string }> }

export const dynamicParams = false

export async function generateStaticParams() {
  const posts = await listPosts()
  const total = Math.max(1, Math.ceil(posts.length / PER_PAGE))
  // 1쪽은 /blog/ 가 담당하므로 2쪽부터 만든다.
  const pages = []
  for (let n = 2; n <= total; n += 1) pages.push({ page: String(n) })
  // 정적 내보내기는 경로가 최소 하나 있어야 하므로 빈 경우 2쪽을 둔다.
  return pages.length > 0 ? pages : [{ page: '2' }]
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { page } = await params
  const n = Number(page)
  return {
    title: `${SITE.name} (${n}쪽)`,
    description: SITE.description,
    alternates: { canonical: pageUrl(n) },
    robots: { index: true, follow: true },
  }
}

export default async function BlogPaged({ params }: Params) {
  const { page } = await params
  const n = Number(page)
  if (!Number.isInteger(n) || n < 2) notFound()

  const posts = await listPosts()
  const categories = await listCategories()
  const result = paginate(posts, n)
  if (posts.length > 0 && n > result.totalPages) notFound()

  return (
    <>
      <ChannelTalk />
      <div className="layout layout-wide">
        <aside className="layout-side">
          <CategoryNav categories={categories} />
        </aside>

        <div className="layout-main">
          {/* 1쪽과 같은 표지를 쓴다. 이번 달 소식 자리에는 몇 쪽인지를 넣는다.
              1쪽만 작은 표지고 2쪽부터 큰 제목이면 넘길 때 화면이 덜컥거린다. */}
          <header className="masthead">
            <h1>{SITE.name}</h1>
            <p className="masthead-issue">
              <span aria-hidden="true">›</span> {result.totalPages}쪽 중 {result.page}쪽입니다
            </p>
          </header>

          <PostList
            posts={result.items}
            page={result.page}
            totalPages={result.totalPages}
            basePath={SITE.basePath}
            showFeatured={false}
          />
        </div>
      </div>
    </>
  )
}
