import { Fragment } from 'react'
import Link from 'next/link'
import { SITE, categoryIcon, 분야묶기 } from '@/config/site'
import { categorySlug } from '@/lib/content'

/** 목록 좌측 카테고리. 각 항목은 실제 카테고리 페이지로 이어진다. */
export function CategoryNav({
  categories,
  active,
}: {
  categories: { name: string; count: number }[]
  active?: string
}) {
  if (categories.length === 0) return null

  const 묶음들 = 분야묶기(categories)

  return (
    <nav className="cat-nav" aria-label="카테고리">
      <p className="cat-nav-all">
        <Link href={`${SITE.basePath}/`} className={active ? undefined : 'is-active'}>
          전체 보기
        </Link>
      </p>
      {/* 묶음마다 ul 을 나누지 않고 한 줄기로 둔다. 좁은 화면에서는 이 ul 이
          가로로 미는 칩 줄이 되는데, 여러 줄기로 쪼개면 그 줄이 끊어진다.
          구분선과 이름은 li 로 끼워 넣고 좁은 화면에서만 감춘다. */}
      <ul>
        {묶음들.map((g, i) => (
          <Fragment key={g.라벨 ?? i}>
            {i > 0 &&
              (g.라벨 ? (
                <li className="cat-nav-label">{g.라벨}</li>
              ) : (
                <li className="cat-nav-sep" aria-hidden="true" />
              ))}
            {g.목록.map((c) => (
              // 좁은 화면에서는 한 줄로 눕히고 옆으로 밀기 때문에, 지금 보고 있는 분야가
              // 줄 끝에 있으면 화면 밖으로 나가 어디인지 알 수 없다. 그 칩만 맨 앞에 세운다.
              <li key={c.name} className={active === c.name ? 'is-current' : undefined}>
                <Link
                  href={`${SITE.basePath}/category/${encodeURIComponent(categorySlug(c.name))}/`}
                  className={active === c.name ? 'is-active' : undefined}
                  aria-current={active === c.name ? 'page' : undefined}
                >
                  <i aria-hidden="true">{categoryIcon(c.name)}</i>
                  <span>{c.name}</span>
                </Link>
              </li>
            ))}
          </Fragment>
        ))}
      </ul>
    </nav>
  )
}
