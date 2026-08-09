import type { PostMeta } from '@/lib/notion'
import { PostCard } from './PostCard'
import { Pagination } from './Pagination'

export const PER_PAGE = 12

export function paginate<T>(items: T[], page: number, perPage = PER_PAGE) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const current = Math.min(Math.max(1, page), totalPages)
  const start = (current - 1) * perPage
  return { items: items.slice(start, start + perPage), page: current, totalPages }
}

/**
 * 카드 목록.
 * 첫 페이지 맨 위 한 편만 크게 보여주고 나머지는 2열로 깐다.
 */
export function PostList({
  posts,
  page,
  totalPages,
  basePath,
  showFeatured = true,
}: {
  posts: PostMeta[]
  page: number
  totalPages: number
  basePath: string
  showFeatured?: boolean
}) {
  if (posts.length === 0) {
    return (
      <p className="empty">
        아직 이 분류에 발행된 글이 없습니다.
      </p>
    )
  }

  const useFeatured = showFeatured && page === 1
  const [first, ...rest] = posts
  const gridPosts = useFeatured ? rest : posts

  return (
    <>
      {useFeatured && <PostCard post={first} featured />}
      {gridPosts.length > 0 && (
        <div className="card-grid">
          {gridPosts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} basePath={basePath} />
    </>
  )
}
