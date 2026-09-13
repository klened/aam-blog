import Link from 'next/link'
import { SITE } from '@/config/site'
import { categorySlug } from '@/lib/slug'

type Item = { name: string; count: number }

/** 상위 분류 안에서 글을 실제 질문별로 좁히는 메뉴. */
export function SubcategoryNav({
  category,
  items,
  active,
}: {
  category: string
  items: Item[]
  active?: string
}) {
  if (items.length === 0) return null

  const base = `${SITE.basePath}/category/${encodeURIComponent(categorySlug(category))}`

  return (
    <nav className="subcategory-nav" aria-label={`${category} 세부 분류`}>
      <Link href={`${base}/`} className={active ? undefined : 'is-active'}>
        전체
      </Link>
      {items.map((item) => (
        <Link
          key={item.name}
          href={`${base}/${encodeURIComponent(categorySlug(item.name))}/`}
          className={active === item.name ? 'is-active' : undefined}
          aria-current={active === item.name ? 'page' : undefined}
        >
          <span>{item.name}</span>
          <em>{item.count}</em>
        </Link>
      ))}
    </nav>
  )
}
