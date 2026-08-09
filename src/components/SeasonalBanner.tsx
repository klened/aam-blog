'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BANNER_IMAGE, SEASONAL } from '@/config/site'
import { encodePath } from '@/lib/slug'

/**
 * 목록 맨 위 '지금 챙기실 것'. 여러 장을 돌린다.
 *
 * 조회수 기반 인기글이 아니다. 정적 사이트라 조회 기록이 없고, 없는 데이터로
 * 인기라는 딱지를 붙이면 그건 거짓말이 된다.
 *
 * 대신 마감이 걸린 것을 앞세운다. 확정정산, 산업재해조사표 제출처럼
 * 노무는 기한이 뚜렷해서 이쪽이 더 정확하고 문의로도 더 잘 이어진다.
 * 마감이 급한 사람이 읽기 때문이다.
 *
 * 돌리기는 하되 첫 장이 대부분이라고 보는 편이 맞다. 뒷장까지 넘겨 보는
 * 사람은 많지 않다. 그래서 가장 급한 것을 맨 앞에 두고 장수를 늘리지 않는다.
 *
 * 저절로 넘어가는 화면은 읽는 사람을 방해할 수 있어 세 가지를 지킨다.
 * 마우스를 올리거나 안쪽에 커서가 가면 멈추고, 점을 눌러 직접 넘길 수 있고,
 * 화면 움직임을 줄여 달라고 설정한 사람에게는 아예 넘기지 않는다.
 *
 * 내용은 src/config/site.ts 의 SEASONAL 에서 사람이 갱신한다.
 */
const 넘기는_간격 = 7000

export function SeasonalBanner({ imageSrcs }: { imageSrcs?: Record<string, string> }) {
  const items = SEASONAL.items
  const [at, setAt] = useState(0)
  const [멈춤, set멈춤] = useState(false)

  useEffect(() => {
    if (멈춤 || items.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setAt((v) => (v + 1) % items.length), 넘기는_간격)
    return () => window.clearInterval(id)
  }, [멈춤, items.length])

  if (!SEASONAL.active) return null

  return (
    <section
      className="seasonal"
      aria-roledescription="배너"
      aria-label="지금 챙기실 것"
      onMouseEnter={() => set멈춤(true)}
      onMouseLeave={() => set멈춤(false)}
      onFocusCapture={() => set멈춤(true)}
      onBlurCapture={() => set멈춤(false)}
    >
      {/* 여러 장을 같은 칸에 겹쳐 둔다. 칸 높이가 가장 긴 장에 맞춰 고정되므로
          넘어갈 때 아래 목록이 위아래로 흔들리지 않는다. */}
      <div className="seasonal-stack">
        {items.map((s, n) => (
          <article
            key={s.heading}
            className={`seasonal-slide${n === at ? ' is-on' : ''}`}
            aria-hidden={n === at ? undefined : true}
          >
            <div className="seasonal-text">
              <p className="seasonal-label">{s.label}</p>
              <p className="seasonal-heading">{s.heading}</p>
              <p className="seasonal-body">{s.body}</p>
              {s.links.length > 0 && (
                <ul className="seasonal-links">
                  {s.links.map((l) => (
                    <li key={l.href}>
                      {/* 보이지 않는 장의 링크로 탭이 넘어가면 안 된다.
                          화면에 없는 곳에 커서만 가 있게 된다. */}
                      <Link href={l.href} tabIndex={n === at ? undefined : -1}>
                        {l.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 사진은 글자 뒤가 아니라 옆에 둔다. 뒤에 깔면 밝은 바탕에 검은 글씨의
                대비를 보장할 수 없고, 이 배너가 기대는 흰 여백도 사라진다.
                좁은 화면에서는 CSS로 감춘다. 글자만으로도 말이 되는 자리다. */}
            {s.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="seasonal-photo"
                // 캐시 표식이 붙은 주소는 서버에서 만들어 넘겨받는다.
                // 여기는 클라이언트라 파일을 읽을 수 없다.
                src={imageSrcs?.[s.image] || encodePath(s.image)}
                width={BANNER_IMAGE.width}
                height={BANNER_IMAGE.height}
                alt=""
                decoding="async"
              />
            )}
          </article>
        ))}
      </div>

      {items.length > 1 && (
        <div className="seasonal-dots">
          {items.map((s, n) => (
            <button
              key={s.heading}
              type="button"
              className={n === at ? 'is-on' : undefined}
              aria-label={s.label}
              aria-current={n === at ? 'true' : undefined}
              onClick={() => setAt(n)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
