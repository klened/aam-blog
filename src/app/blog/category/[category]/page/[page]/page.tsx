import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { categoryFromSlug, categorySlug, listCategories, listPosts } from '@/lib/content'
import { SITE, categoryIcon, categoryIntro } from '@/config/site'
import { categoryUrl } from '@/lib/seo'
import { ChannelTalk } from '@/components/ChannelTalk'
import { CategoryNav } from '@/components/CategoryNav'
import { PostList, PER_PAGE, paginate } from '@/components/PostList'

type Params = { params: Promise<{ category: string; page: string }> }

export const dynamicParams = false

export async function generateStaticParams() {
  const cats = await listCategories()
  const posts = await listPosts()
  const out: { category: string; page: string }[] = []

  for (const c of cats) {
    const total = Math.max(1, Math.ceil(posts.filter((p) => p.category === c.name).length / PER_PAGE))
    for (let n = 2; n <= total; n += 1) {
      out.push({ category: categorySlug(c.name), page: String(n) })
    }
  }
  // 정적 내보내기는 경로가 최소 하나 필요하다.
  return out.length > 0 ? out : [{ category: '준비중', page: '2' }]
}

async function resolve(slug: string) {
  const cats = await listCategories()
  const name = categoryFromSlug(slug, cats.map((c) => c.name))
  if (!name) return null
  const posts = (await listPosts()).filter((p) => p.category === name)
  return { name, posts, cats }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category, page } = await params
  const found = await resolve(category)
  if (!found) return { title: '준비 중', robots: { index: false, follow: false } }
  const n = Number(page)
  return {
    title: `${found.name} 실무 가이드 (${n}쪽)`,
    alternates: { canonical: categoryUrl(categorySlug(found.name), n) },
  }
}

export default async function CategoryPaged({ params }: Params) {
  const { category, page } = await params
  const n = Number(page)
  const found = await resolve(category)
  if (!found || !Number.isInteger(n) || n < 2) notFound()

  const { name, posts, cats } = found
  const result = paginate(posts, n)
  if (posts.length > 0 && n > result.totalPages) notFound()
  const base = `${SITE.basePath}/category/${encodeURIComponent(categorySlug(name))}`

  return (
    <>
      <ChannelTalk />
      <div className="layout layout-wide">
        <aside className="layout-side">
          <CategoryNav categories={cats} active={name} />
        </aside>

        <div className="layout-main">
          <nav className="crumbs" aria-label="현재 위치">
            <Link href={`${SITE.basePath}/`}>{SITE.name}</Link>
            <span aria-hidden="true"> › </span>
            <Link href={`${base}/`}>{name}</Link>
          </nav>

          <header className="list-hero">
            <h1>
              <span className="hero-icon" aria-hidden="true">
                {categoryIcon(name)}
              </span>{' '}
              {name}
            </h1>
            <p>
              {categoryIntro(name)} {result.totalPages}쪽 중 {result.page}쪽입니다.
            </p>
          </header>

          <PostList
            posts={result.items}
            page={result.page}
            totalPages={result.totalPages}
            basePath={base}
            showFeatured={false}
          />
        </div>
      </div>
    </>
  )
}
