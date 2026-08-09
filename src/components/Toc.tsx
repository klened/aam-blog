'use client'

import { useEffect, useRef, useState } from 'react'
import type { TocItem } from '@/lib/blocks'

/**
 * 목차.
 * 스크롤에 따라 지금 읽고 있는 섹션을 표시한다.
 * h2가 3개 미만이면 오히려 방해가 되므로 그리지 않는다.
 *
 * `depth`로 어디까지 보여줄지 정한다. 이 블로그의 소제목은
 * 「적용 대상이어도 산정에서 제외되는 급여가 있습니다」처럼 완결된 문장이라
 * 좁은 칸에서는 두 줄로 접힌다. 실측으로 12개 항목이 18줄을 차지했다.
 * 그래서 사이드바는 큰 제목만 보여주고, 눌러서 펴는 본문 위 목차는 다 보여준다.
 */
export function Toc({ items, depth = 3 }: { items: TocItem[]; depth?: number }) {
  const [activeId, setActiveId] = useState<string>('')
  const navRef = useRef<HTMLElement | null>(null)

  // 그리는 것과 따라가는 것이 같아야 한다. 감춘 소제목까지 따라가면
  // 그 구간을 읽는 동안 어느 줄도 켜지지 않아 지금 위치를 알 수 없게 된다.
  const shown = items.filter((it) => it.level <= depth)
  const ids = shown.map((it) => it.id).join('|')

  useEffect(() => {
    if (ids === '') return

    const headings = ids
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
    if (headings.length === 0) return

    let frame = 0
    const update = () => {
      frame = 0
      // 헤더 높이를 감안해 화면 상단에서 조금 내려온 지점을 기준선으로 삼는다.
      const line = 140
      let current = headings[0].id

      for (const h of headings) {
        if (h.getBoundingClientRect().top <= line) current = h.id
        else break
      }

      // 문서 끝까지 내려갔다면 마지막 항목을 활성화한다.
      const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 80
      if (atBottom) current = headings[headings.length - 1].id

      setActiveId(current)
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [ids])

  // 활성 항목이 사이드바 밖으로 나가면 목차 안에서만 살짝 스크롤한다.
  useEffect(() => {
    const nav = navRef.current
    if (!nav || !activeId) return
    const el = nav.querySelector<HTMLAnchorElement>(`a[href="#${CSS.escape(activeId)}"]`)
    if (!el) return
    const navBox = nav.getBoundingClientRect()
    const box = el.getBoundingClientRect()
    if (box.top < navBox.top || box.bottom > navBox.bottom) {
      el.scrollIntoView({ block: 'nearest' })
    }
  }, [activeId])

  const h2count = items.filter((i) => i.level === 2).length
  if (h2count < 3) return null

  return (
    <nav className="toc" aria-label="목차" ref={navRef}>
      <p className="toc-title">이 글의 내용</p>
      <ol>
        {shown.map((it) => (
          <li key={it.id} data-level={it.level}>
            <a
              href={`#${it.id}`}
              className={activeId === it.id ? 'is-active' : undefined}
              aria-current={activeId === it.id ? 'true' : undefined}
            >
              {it.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
