import Link from 'next/link'
import type { PostMeta } from '@/lib/notion'
import { SITE, categoryIcon } from '@/config/site'
import { imageAttrs } from '@/lib/imageAttrs'

/**
 * 목록 카드에 띄울 업종 태그.
 *
 * 「중소기업」은 거의 모든 글에 붙어 있어 이것이 있고 없고로 갈리는 것이
 * 없다. 「사례」도 글의 성격이지 독자를 가르지 않는다. 업종만 남기면
 * 자기 업종을 찾는 사람이 목록에서 바로 집어낸다.
 */
const 업종태그 = new Set(['병의원', '건설업', '요양병원', '봉직의'])

/**
 * 목록에 쓰는 카드.
 * `featured`는 목록 맨 위 한 편을 크게 보여줄 때 쓴다.
 */
export function PostCard({ post, featured = false }: { post: PostMeta; featured?: boolean }) {
  const href = `${SITE.basePath}/${encodeURIComponent(post.slug)}/`
  const 업종 = post.tags.filter((t) => 업종태그.has(t))

  return (
    <article className={featured ? 'card card-featured' : 'card'}>
      <Link href={href}>
        <div className="card-thumb">
          {post.coverImage ? (
            // 정적 export라 next/image 최적화를 쓰지 않는다.
            // eslint-disable-next-line @next/next/no-img-element
            <img
          {...imageAttrs(post.coverImage)}
          alt=""
          loading={featured ? 'eager' : 'lazy'}
          decoding="async"
        />
          ) : (
            <div className="card-thumb-fallback">
              <span>{categoryIcon(post.category)}</span>
            </div>
          )}
          {post.category && (
            <span className="card-badge">
              <i aria-hidden="true">{categoryIcon(post.category)}</i>
              {post.category}
            </span>
          )}
          {post.status !== '발행' && <span className="card-draft">{post.status}</span>}
          {업종.length > 0 && (
            <span className="card-industry">{업종.join(' · ')}</span>
          )}
        </div>

        <h2 className="card-title">{post.title}</h2>

        {featured && post.summary && <p className="card-summary">{post.summary}</p>}

        {/* 제목이 「무엇을 묻는 글인가」라면 이 줄은 「읽으면 무엇이 되는가」다.
            목록에서 고르는 사람은 제목만 보고 자기 상황인지 확신하지 못한다.
            조회수나 좋아요를 붙이는 방법도 있지만, 정적 사이트라 좋아요는
            담을 곳이 없고 조회수는 신생 사이트에서 작은 숫자가 나와 오히려
            눌리지 않게 만든다. 이 한 줄은 글마다 이미 적혀 있고 사람마다
            다르게 읽히므로 그 자리를 대신한다. */}
        {post.gain && <p className="card-gain">{post.gain}</p>}

        {/* 목록에서는 날짜를 빼고 분량만 둔다.
            글은 한 편씩 쓰지만 올리는 것은 몇 편씩 묶어서 하게 된다. 그러면
            목록에 같은 날짜가 줄줄이 늘어서서 「하루에 다 만든 글」처럼 보인다.
            내용이 갈리는 정보도 아니라서 목록에서는 도움이 되지 않는다.

            글을 열면 제목 아래에 날짜가 그대로 있고, 근거 법령과 확인 시점도
            함께 나온다. 법령이 바뀌는 분야라 「언제 기준인가」는 신뢰의
            핵심이므로 거기서는 빼지 않는다. 검색엔진이 읽는 구조화 데이터도
            그대로다. */}
        {post.readingMinutes > 0 && <p className="card-date">{post.readingMinutes}분 분량</p>}
      </Link>
    </article>
  )
}
