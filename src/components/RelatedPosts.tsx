import Link from 'next/link'
import type { PostMeta } from '@/lib/notion'
import { SITE, coverFor } from '@/config/site'
import { imageAttrs } from '@/lib/imageAttrs'

/**
 * 글 아래에 거는 다른 글.
 *
 * 내부 링크는 색인 순환과 체류시간 양쪽에 기여한다. 글자만 있던 목록을
 * 사진이 있는 카드로 바꿨다. 어차피 글마다 대표이미지가 있으므로 새로 구할
 * 것이 없고, 사진이 있으면 눌릴 확률이 올라간다.
 *
 * 제목은 무엇을 골랐는지에 따라 달라진다. 조회수 상위 글을 내보낼 때만
 * 「지금 인기있는 글」이라고 부른다. 아직 숫자가 없는데 인기라고 적으면
 * 그건 사실이 아닌 말을 첫 화면에 거는 것이 된다.
 */
export function RelatedPosts({ posts, ranked = false }: { posts: PostMeta[]; ranked?: boolean }) {
  if (posts.length === 0) return null

  const title = ranked ? '지금 인기있는 글' : '함께 읽으면 좋은 글'

  return (
    <section className="related" aria-label={title}>
      <h2 className="related-title">{title}</h2>
      <ul className="related-cards">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link href={`${SITE.basePath}/${encodeURIComponent(p.slug)}/`}>
              <span className="related-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  {...imageAttrs(coverFor(p.coverImage, p.category))}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              </span>
              {/* 여기도 날짜를 빼고 분야만 둔다. 목록 카드와 같은 이유다.
                  글을 열면 제목 아래에 날짜가 있다. */}
              <span className="related-body">
                <span className="related-cat">{p.category}</span>
                <span className="related-name">{p.title}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
