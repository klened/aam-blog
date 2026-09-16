import type { Metadata } from 'next'
import { listCategories, listPosts } from '@/lib/content'
import { MASTHEAD, SITE } from '@/config/site'
import { blogJsonLd, listUrl } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import { ChannelTalk } from '@/components/ChannelTalk'
import { CategoryNav } from '@/components/CategoryNav'
import { SeasonalBanner } from '@/components/SeasonalBanner'
import { imageSrc } from '@/lib/imageSize'
import { SEASONAL } from '@/config/site'
import { StageExplorer } from '@/components/StageExplorer'
import { PopularPostGrid } from '@/components/PopularPostGrid'
import { popularSlugs } from '@/lib/popular'

/**
 * 검색결과와 브라우저 탭에 뜨는 제목. 화면 맨 위 표지와 같은 문구를 쓴다.
 * 뒤에는 레이아웃이 ` | 노무법인 도원` 을 붙인다. 회사 이름은 실제로 검색되는
 * 말이라 떼지 않는다.
 *
 * MASTHEAD.issue 를 그대로 가져오므로 한 곳만 고치면 화면과 제목이 함께 바뀐다.
 * 다만 거기에 달을 넣으면 이 제목도 매달 바뀐다. 같은 페이지의 제목이 자주
 * 바뀌면 검색엔진이 같은 문서로 보기 어려워지므로, 달을 쓰실 거라면 이 줄만
 * 고정된 문구로 따로 적는 편이 낫다.
 */
const 제목 = `${SITE.name} › ${MASTHEAD.issue}`

export const metadata: Metadata = {
  title: 제목,
  description: SITE.description,
  alternates: { canonical: listUrl() },
  openGraph: {
    title: 제목,
    description: SITE.description,
    url: listUrl(),
    type: 'website',
  },
}

export default async function BlogIndex() {
  const posts = await listPosts()
  const categories = await listCategories()
  const rankedPosts = popularSlugs()
    .map((slug) => posts.find((post) => post.slug === slug))
    .filter((post): post is (typeof posts)[number] => Boolean(post))
    .slice(0, 6)
  const hasWeeklyRanking = rankedPosts.length >= 6
  const homePosts = hasWeeklyRanking ? rankedPosts : posts.slice(0, 6)

  return (
    <>
      <JsonLd data={blogJsonLd(posts)} />
      <ChannelTalk />

      <div className="layout layout-wide">
        <aside className="layout-side">
          <CategoryNav categories={categories} />
        </aside>

        <div className="layout-main">
          <StageExplorer posts={posts} />

          <SeasonalBanner
            imageSrcs={Object.fromEntries(
              SEASONAL.items.filter((s) => s.image).map((s) => [s.image, imageSrc(s.image)])
            )}
          />

          <PopularPostGrid posts={homePosts} ranked={hasWeeklyRanking} />
        </div>
      </div>
    </>
  )
}
