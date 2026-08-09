import type { PostMeta } from '@/lib/notion'

/**
 * 글 끝 근거 표시.
 *
 * 작성자와 날짜는 제목 아래에 이미 있고 구조화 데이터로도 나가므로 여기서 되풀이하지 않는다.
 * 여기에만 있는 것은 세 가지다.
 *
 * 근거 법령 — 지어낸 말이 아니라 법에 있는 내용이라는 표시.
 * 확인 시점 — 언제 기준으로 맞는 말인지. 옮겨온 옛 글에서 특히 중요하다.
 * 면책 문구 — 공개 글이 개별 사안에 대한 판단으로 오해되지 않게 한다.
 *
 * 상자 안에 상자를 두지 않는다. 한 겹으로 두고 줄로만 나눈다.
 */
export function AuthorBlock({ post }: { post: PostMeta }) {
  const rows: { label: string; body: React.ReactNode }[] = []

  if (post.lawName) {
    rows.push({
      label: '참고 자료',
      body: post.lawUrl ? (
        <a href={post.lawUrl} target="_blank" rel="noopener noreferrer">
          {post.lawName}
        </a>
      ) : (
        post.lawName
      ),
    })
  }
  if (post.updateNote) {
    rows.push({ label: '확인 시점', body: post.updateNote })
  }

  return (
    <section className="author-block" aria-label="근거와 안내">
      {rows.length > 0 && (
        <dl>
          {rows.map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.body}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="author-note">
        이 글은 일반적인 정보 제공을 목적으로 하며, 장비 사양·소재 물성·가격은 제조사 정책에 따라
        달라질 수 있습니다. 실제 부품 조건에 맞는 판단은 담당 엔지니어와 상담하시기 바랍니다.
      </p>
    </section>
  )
}
