import type { PostMeta } from '@/lib/notion'
import { PostCard } from './PostCard'

export function PopularPostGrid({ posts, ranked }: { posts: PostMeta[]; ranked: boolean }) {
  if (posts.length === 0) return null

  return (
    <section className="popular-post-grid" aria-labelledby="popular-post-grid-title">
      <header className="popular-post-grid-head">
        <span>{ranked ? '최근 7일 조회 기준' : '새로 발행한 글'}</span>
        <h2 id="popular-post-grid-title">
          {ranked ? '주간 인기 글' : '최근 업데이트된 글'}
        </h2>
        <p>
          {ranked
            ? '이번 주에 가장 많이 읽힌 글 6편입니다.'
            : '조회 데이터가 충분히 쌓이기 전에는 최근 글 6편을 보여드립니다.'}
        </p>
      </header>

      <div className="card-grid popular-post-grid-cards">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  )
}
