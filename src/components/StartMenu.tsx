'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { SITE } from '@/config/site'

const START_ITEMS = [
  {
    eyebrow: '01 · 먼저 읽기',
    title: '부품 조달이 막혔습니다',
    description: '3D프린팅을 검토하는 순서와 진행 기준',
    slug: '부품-조달-3d프린팅-판단',
    primary: true,
  },
  {
    eyebrow: '02 · 도면 준비',
    title: 'STL·CAD 파일이 없습니다',
    description: '실물·사진·스케치로 데이터를 만드는 방법',
    slug: 'stl-파일-없을-때-3d모델링',
    primary: false,
  },
  {
    eyebrow: '03 · 견적 준비',
    title: '비용과 납기가 궁금합니다',
    description: '견적에 필요한 자료와 제작 진행 5단계',
    slug: '3d프린팅-출력대행-절차',
    primary: false,
  },
  {
    eyebrow: '04 · 기술 선택',
    title: '공정·소재를 정하지 못했습니다',
    description: '용도와 사용 환경으로 후보를 좁히는 방법',
    slug: '산업용-3d프린터-방식-4가지',
    primary: false,
  },
] as const

/**
 * 처음 방문한 담당자가 기술 이름을 모르더라도 현재 상황에서 출발하게 한다.
 * 분야 메뉴는 기술 분류를 유지하고, 이 메뉴는 의뢰 준비 순서만 맡는다.
 */
export function StartMenu() {
  const pathname = usePathname()
  const [열림, 열림설정] = useState(false)
  const 상자 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    열림설정(false)
  }, [pathname])

  useEffect(() => {
    if (!열림) return

    const 바깥누름 = (event: PointerEvent) => {
      if (!상자.current?.contains(event.target as Node)) 열림설정(false)
    }
    const 키누름 = (event: KeyboardEvent) => {
      if (event.key === 'Escape') 열림설정(false)
    }

    document.addEventListener('pointerdown', 바깥누름)
    document.addEventListener('keydown', 키누름)
    return () => {
      document.removeEventListener('pointerdown', 바깥누름)
      document.removeEventListener('keydown', 키누름)
    }
  }, [열림])

  return (
    <div className={열림 ? 'start-menu is-open' : 'start-menu'} ref={상자}>
      <button
        type="button"
        className="start-menu-btn"
        aria-haspopup="true"
        aria-expanded={열림}
        onClick={() => 열림설정((value) => !value)}
      >
        출력 시작하기
        <span className="start-menu-caret" aria-hidden="true" />
      </button>

      <div className="start-menu-panel">
        <section className="start-menu-card" aria-label="출력 시작하기">
          <div className="start-menu-heading">
            <strong>지금 겪고 있는 상황부터 선택하세요</strong>
            <span>필요한 글로 바로 안내합니다</span>
          </div>
          <div className="start-menu-grid">
            {START_ITEMS.map((item) => (
              <Link
                key={item.slug}
                href={`${SITE.basePath}/${encodeURIComponent(item.slug)}/`}
                className={item.primary ? 'start-menu-item is-primary' : 'start-menu-item'}
              >
                <small>{item.eyebrow}</small>
                <b>{item.title}</b>
                <span>{item.description}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
