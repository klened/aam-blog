import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  categoryFromSlug,
  categorySlug,
  listCategories,
  listPosts,
  listSubcategories,
  subcategoryFromSlug,
} from '@/lib/content'
import { ORG, SITE, categoryIcon } from '@/config/site'
import { listUrl, postUrl, subcategoryUrl } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import { ChannelTalk } from '@/components/ChannelTalk'
import { CategoryNav } from '@/components/CategoryNav'
import { PostList } from '@/components/PostList'
import { SubcategoryNav } from '@/components/SubcategoryNav'

type Params = { params: Promise<{ category: string; subcategory: string }> }

export const dynamicParams = false

export async function generateStaticParams() {
  const posts = await listPosts()
  const seen = new Set<string>()
  const out: { category: string; subcategory: string }[] = []

  for (const post of posts) {
    if (!post.category || !post.subcategory) continue
    const category = categorySlug(post.category)
    const subcategory = categorySlug(post.subcategory)
    const key = `${category}\u0000${subcategory}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ category, subcategory })
  }

  return out.length > 0 ? out : [{ category: '준비중', subcategory: '준비중' }]
}

async function resolve(categoryParam: string, subcategoryParam: string) {
  const cats = await listCategories()
  const category = categoryFromSlug(categoryParam, cats.map((c) => c.name))
  if (!category) return null

  const subcategories = await listSubcategories(category)
  const subcategory = subcategoryFromSlug(
    subcategoryParam,
    subcategories.map((s) => s.name)
  )
  if (!subcategory) return null

  const posts = (await listPosts()).filter(
    (p) => p.category === category && p.subcategory === subcategory
  )
  return { category, subcategory, posts, cats, subcategories }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category, subcategory } = await params
  const found = await resolve(category, subcategory)
  if (!found) return { title: '준비 중', robots: { index: false, follow: false } }

  const title = `${found.subcategory} | ${found.category}`
  const description = `${found.category} 가운데 ${found.subcategory}에 해당하는 글을 모았습니다.`
  const url = subcategoryUrl(found.category, found.subcategory)

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website' },
  }
}

export default async function SubcategoryPage({ params }: Params) {
  const { category, subcategory } = await params
  const found = await resolve(category, subcategory)
  if (!found) notFound()

  const base = `${SITE.basePath}/category/${encodeURIComponent(categorySlug(found.category))}`
  const url = subcategoryUrl(found.category, found.subcategory)
  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${found.subcategory} | ${found.category}`,
    url,
    inLanguage: SITE.language,
    isPartOf: { '@type': 'Blog', '@id': `${listUrl()}#blog` },
    hasPart: found.posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: postUrl(post.slug),
      datePublished: post.publishedAt,
    })),
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: ORG.name, item: `${ORG.url}/` },
      { '@type': 'ListItem', position: 2, name: SITE.name, item: listUrl() },
      { '@type': 'ListItem', position: 3, name: found.category, item: `${SITE.url}${base}/` },
      { '@type': 'ListItem', position: 4, name: found.subcategory, item: url },
    ],
  }

  return (
    <>
      <JsonLd data={collectionLd} />
      <JsonLd data={breadcrumbLd} />
      <ChannelTalk />

      <div className="layout layout-wide">
        <aside className="layout-side">
          <CategoryNav categories={found.cats} active={found.category} />
        </aside>

        <div className="layout-main">
          <nav className="crumbs" aria-label="현재 위치">
            <Link href={`${SITE.basePath}/`}>{SITE.name}</Link>
            <span aria-hidden="true"> › </span>
            <Link href={`${base}/`}>{found.category}</Link>
            <span aria-hidden="true"> › </span>
            <span>{found.subcategory}</span>
          </nav>

          <header className="list-hero">
            <h1>
              <span className="hero-icon" aria-hidden="true">
                {categoryIcon(found.category)}
              </span>{' '}
              {found.subcategory}
            </h1>
            <p>
              {found.category} 가운데 {found.subcategory}에 해당하는 글을 모았습니다.
            </p>
          </header>

          <SubcategoryNav
            category={found.category}
            items={found.subcategories}
            active={found.subcategory}
          />

          <PostList
            posts={found.posts}
            page={1}
            totalPages={1}
            basePath={`${base}/${encodeURIComponent(categorySlug(found.subcategory))}`}
            showFeatured={false}
          />
        </div>
      </div>
    </>
  )
}
