import Link from 'next/link'

/**
 * 목록 페이지 나누기.
 * 글이 수백 편이 되면 한 페이지에 다 그릴 수 없고, 검색엔진도 싫어한다.
 */
export function Pagination({
  page,
  totalPages,
  basePath,
}: {
  page: number
  totalPages: number
  /** 예: /blog 또는 /blog/category/산업재해 */
  basePath: string
}) {
  if (totalPages <= 1) return null

  const href = (n: number) => (n === 1 ? `${basePath}/` : `${basePath}/page/${n}/`)

  // 현재 쪽 주변만 보여주고 나머지는 줄임표로 접는다.
  const nums: (number | '…')[] = []
  for (let n = 1; n <= totalPages; n += 1) {
    if (n === 1 || n === totalPages || Math.abs(n - page) <= 1) nums.push(n)
    else if (nums[nums.length - 1] !== '…') nums.push('…')
  }

  return (
    <nav className="pager" aria-label="페이지">
      {page > 1 ? (
        <Link className="pager-arrow" href={href(page - 1)} rel="prev">
          이전
        </Link>
      ) : (
        <span className="pager-arrow is-off">이전</span>
      )}

      <ul>
        {nums.map((n, i) =>
          n === '…' ? (
            <li key={`gap-${i}`} className="pager-gap">
              …
            </li>
          ) : (
            <li key={n}>
              {n === page ? (
                <span className="is-current" aria-current="page">
                  {n}
                </span>
              ) : (
                <Link href={href(n)}>{n}</Link>
              )}
            </li>
          )
        )}
      </ul>

      {page < totalPages ? (
        <Link className="pager-arrow" href={href(page + 1)} rel="next">
          다음
        </Link>
      ) : (
        <span className="pager-arrow is-off">다음</span>
      )}
    </nav>
  )
}
