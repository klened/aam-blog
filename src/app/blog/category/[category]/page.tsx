import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { categoryFromSlug, categorySlug, listCategories, listPosts } from '@/lib/content'
import { ORG, SITE, categoryIcon, categoryIntro } from '@/config/site'
import { categoryUrl, listUrl, postUrl } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import { ChannelTalk } from '@/components/ChannelTalk'
import { CategoryNav } from '@/components/CategoryNav'
import { PostList, paginate } from '@/components/PostList'

type Params = { params: Promise<{ category: string }> }

export const dynamicParams = false

export async function generateStaticParams() {
  const cats = await listCategories()
  if (cats.length === 0) return [{ category: '준비중' }]
  return cats.map((c) => ({ category: categorySlug(c.name) }))
}

async function resolve(slug: string) {
  const cats = await listCategories()
  const name = categoryFromSlug(slug, cats.map((c) => c.name))
  if (!name) return null
  const posts = (await listPosts()).filter((p) => p.category === name)
  return { name, posts, cats }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params
  const found = await resolve(category)
  if (!found) return { title: '준비 중', robots: { index: false, follow: false } }

  const title = `${found.name} 실무 가이드`
  const description = categoryIntro(found.name)

  return {
    title,
    description,
    alternates: { canonical: categoryUrl(categorySlug(found.name)) },
    openGraph: {
      title,
      description,
      url: categoryUrl(categorySlug(found.name)),
      type: 'website',
    },
  }
}

export default async function CategoryPage({ params }: Params) {
  const { category } = await params
  const found = await resolve(category)
  if (!found) notFound()

  const { name, posts, cats } = found
  const { items, page, totalPages } = paginate(posts, 1)
  const base = `${SITE.basePath}/category/${encodeURIComponent(categorySlug(name))}`

  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${name} 실무 가이드`,
    url: categoryUrl(categorySlug(name)),
    inLanguage: SITE.language,
    isPartOf: { '@type': 'Blog', '@id': `${listUrl()}#blog` },
    hasPart: posts.slice(0, 20).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: postUrl(p.slug),
      datePublished: p.publishedAt,
    })),
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: ORG.name, item: `${ORG.url}/` },
      { '@type': 'ListItem', position: 2, name: SITE.name, item: listUrl() },
      { '@type': 'ListItem', position: 3, name, item: categoryUrl(categorySlug(name)) },
    ],
  }

  return (
    <>
      <JsonLd data={collectionLd} />
      <JsonLd data={breadcrumbLd} />
      <ChannelTalk />

      <div className="layout layout-wide">
        <aside className="layout-side">
          <CategoryNav categories={cats} active={name} />
        </aside>

        <div className="layout-main">
          <nav className="crumbs" aria-label="현재 위치">
            <Link href={`${SITE.basePath}/`}>{SITE.name}</Link>
            <span aria-hidden="true"> › </span>
            <span>{name}</span>
          </nav>

          <header className="list-hero">
            <h1>
              <span className="hero-icon" aria-hidden="true">
                {categoryIcon(name)}
              </span>{' '}
              {name}
            </h1>
            <p>{categoryIntro(name)}</p>
          </header>

          <PostList posts={items} page={page} totalPages={totalPages} basePath={base} />
        </div>
      </div>
    </>
  )
}
