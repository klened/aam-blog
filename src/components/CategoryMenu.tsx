'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment, useEffect, useRef, useState } from 'react'
import { SITE, categoryIcon, 분야묶기 } from '@/config/site'
// content.ts 가 아니라 slug.ts 에서 가져온다. content.ts 는 node:fs 를 쓰므로
// 클라이언트 컴포넌트가 거기서 꺼내면 번들이 깨진다.
import { categorySlug } from '@/lib/slug'

/**
 * 머리글의 분야 메뉴. 마우스를 올리면 펼쳐진다.
 *
 * 목록에서는 왼쪽 사이드바가 분야를 보여 주지만 글로 들어가면 그 자리가
 * 목차로 바뀐다. 그래서 글을 읽는 중에는 다른 분야로 넘어갈 길이 없었다.
 * 머리글은 어느 페이지에나 있으므로 여기에 두면 그 구멍이 메워진다.
 *
 * 마우스가 있는 기기는 올리기만 해도 펼쳐지고(@media (hover: hover)),
 * 그 밖에는 단추를 눌러 여닫는다. 예전에는 :focus-within 에만 기대고 있었는데,
 * iOS 사파리는 단추를 눌러도 초점을 주지 않는 경우가 있어 손가락으로는
 * 열리지 않았다. 글 상세에서는 왼쪽 분야 목록이 목차로 바뀌어 사라지므로
 * 이 메뉴가 다른 분야로 가는 유일한 길이다. 열리지 않으면 길이 없다.
 *
 * 지금 보고 있는 분야를 짚어 주려고 주소를 읽는다. 그래서 클라이언트
 * 컴포넌트다. 분야 목록 자체는 빌드할 때 정해지므로 속성으로 받는다.
 */
export function CategoryMenu({ categories }: { categories: { name: string; count: number }[] }) {
  const pathname = decodeURIComponent(usePathname() || '')
  const 지금분야 = (() => {
    const m = new RegExp(`^${SITE.basePath}/category/([^/]+)`).exec(pathname)
    return m ? m[1] : null
  })()

  const [열림, 열림설정] = useState(false)
  const 상자 = useRef<HTMLDivElement>(null)

  // 다른 쪽으로 넘어가면 닫는다. 열어 둔 채로 이동하면 새 화면을 메뉴가 덮는다.
  useEffect(() => {
    열림설정(false)
  }, [pathname])

  // 바깥을 누르거나 Esc 를 치면 닫는다. 열려 있는 동안만 듣는다.
  useEffect(() => {
    if (!열림) return
    const 바깥누름 = (e: PointerEvent) => {
      if (!상자.current?.contains(e.target as Node)) 열림설정(false)
    }
    const 키누름 = (e: KeyboardEvent) => {
      if (e.key === 'Escape') 열림설정(false)
    }
    document.addEventListener('pointerdown', 바깥누름)
    document.addEventListener('keydown', 키누름)
    return () => {
      document.removeEventListener('pointerdown', 바깥누름)
      document.removeEventListener('keydown', 키누름)
    }
  }, [열림])

  if (categories.length === 0) return null

  return (
    <div className={열림 ? 'cat-menu is-open' : 'cat-menu'} ref={상자}>
      <button
        type="button"
        className="cat-menu-btn"
        aria-haspopup="true"
        aria-expanded={열림}
        onClick={() => 열림설정((v) => !v)}
      >
        분야
        <span className="cat-menu-caret" aria-hidden="true" />
      </button>

      {/* 바깥 상자에 위쪽 여백을 줘서 단추와 목록 사이가 끊기지 않게 한다.
          여백이 없으면 마우스가 그 틈을 지나는 순간 메뉴가 닫힌다. */}
      <div className="cat-menu-panel">
        <div className="cat-menu-card">
          <Link href={`${SITE.basePath}/`} className="cat-menu-all">
            전체 글 보기
          </Link>
          {/* 왼쪽 사이드바와 같은 묶음·같은 순서로 세운다. 두 메뉴가 다르게
              보이면 목록이 긴 것보다 헷갈린다. */}
          <ul>
            {분야묶기(categories).map((g, i) => (
              <Fragment key={g.라벨 ?? i}>
                {i > 0 &&
                  (g.라벨 ? (
                    <li className="cat-nav-label">{g.라벨}</li>
                  ) : (
                    <li className="cat-nav-sep" aria-hidden="true" />
                  ))}
                {g.목록.map((c) => {
                  const slug = categorySlug(c.name)
                  const 지금 = 지금분야 === slug
                  return (
                    <li key={c.name}>
                      <Link
                        href={`${SITE.basePath}/category/${encodeURIComponent(slug)}/`}
                        className={지금 ? 'is-active' : undefined}
                        aria-current={지금 ? 'page' : undefined}
                      >
                        <i aria-hidden="true">{categoryIcon(c.name)}</i>
                        <span>{c.name}</span>
                      </Link>
                    </li>
                  )
                })}
              </Fragment>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
