'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { PostMeta } from '@/lib/notion'
import { SITE } from '@/config/site'

const STAGES = [
  {
    id: 'procurement',
    eyebrow: '01',
    title: '부품 조달이 막혔어요',
    description: '단종·긴급 납기·최소 주문 수량 문제부터 확인합니다.',
    resultLabel: '부품 조달이 막혔을 때',
    slugs: ['부품-조달-3d프린팅-판단', '도면-없는-부품-제작', 'cnc-3d프린팅-비교'],
  },
  {
    id: 'drawing',
    eyebrow: '02',
    title: '3D 도면(STL) 파일이 없어요',
    description: '실물·사진·스케치로 3D 데이터를 만드는 방법을 찾습니다.',
    resultLabel: '3D 파일이 없을 때',
    slugs: ['stl-파일-없을-때-3d모델링', '도면-없는-부품-제작', '역설계-비용-사례-4건'],
  },
  {
    id: 'quote',
    eyebrow: '03',
    title: '비용과 납기가 궁금해요',
    description: '견적 자료, 수량별 단가와 납품 일정을 확인합니다.',
    resultLabel: '견적과 납기를 확인할 때',
    slugs: ['3d프린팅-출력대행-절차', '견적-전에-정할-것', '3d프린팅-소량생산-단가'],
  },
  {
    id: 'technology',
    eyebrow: '04',
    title: '공정·소재를 정하지 못했어요',
    description: '용도와 사용 환경으로 공정과 소재 후보를 좁힙니다.',
    resultLabel: '공정과 소재를 정할 때',
    slugs: ['산업용-3d프린터-방식-4가지', 'sla-sls-비교', '3d프린팅-소재-종류'],
  },
] as const

type StageId = (typeof STAGES)[number]['id']

function StageIcon({ id }: { id: StageId }) {
  const common = {
    viewBox: '0 0 32 32',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (id === 'procurement') {
    return (
      <span className="stage-explorer-icon">
        <svg {...common}>
          <path d="M5.5 11 16 5.5 26.5 11 16 16.5 5.5 11Z" />
          <path d="M5.5 11v10L16 26.5 26.5 21V11M16 16.5v10" />
          <path d="m22.5 5.5 4 4M26.5 5.5l-4 4" />
        </svg>
      </span>
    )
  }

  if (id === 'drawing') {
    return (
      <span className="stage-explorer-icon">
        <svg {...common}>
          <path d="M8 4.5h10l6 6v17H8Z" />
          <path d="M18 4.5v6h6M12 16h8M12 20h8" />
          <path d="M13 24h6" />
        </svg>
      </span>
    )
  }

  if (id === 'quote') {
    return (
      <span className="stage-explorer-icon">
        <svg {...common}>
          <circle cx="14" cy="15" r="9" />
          <path d="M14 10v5l3.5 2M10 4.5h8" />
          <circle cx="23.5" cy="23" r="4.5" />
        </svg>
      </span>
    )
  }

  return (
    <span className="stage-explorer-icon">
      <svg {...common}>
        <path d="M5 8h22M5 16h22M5 24h22" />
        <circle cx="11" cy="8" r="3" />
        <circle cx="21" cy="16" r="3" />
        <circle cx="14" cy="24" r="3" />
      </svg>
    </span>
  )
}

export function StageExplorer({ posts }: { posts: PostMeta[] }) {
  const [activeId, setActiveId] = useState<StageId>('procurement')
  const active = STAGES.find((stage) => stage.id === activeId) ?? STAGES[0]
  const postsBySlug = new Map(posts.map((post) => [post.slug, post]))
  const selected = active.slugs
    .map((slug) => postsBySlug.get(slug))
    .filter((post): post is PostMeta => Boolean(post))

  return (
    <section className="stage-explorer" aria-labelledby="stage-explorer-title">
      <header className="stage-explorer-heading">
        <span>3D프린팅 출력 시작하기</span>
        <h2 id="stage-explorer-title">지금 어떤 단계이신가요?</h2>
        <p>현재 상황을 선택하면 먼저 확인할 글부터 보여드립니다.</p>
      </header>

      <div className="stage-explorer-panel">
        <div className="stage-explorer-grid" role="tablist" aria-label="진행 단계 선택">
          {STAGES.map((stage) => {
            const selectedStage = stage.id === active.id
            return (
              <button
                type="button"
                role="tab"
                id={`stage-tab-${stage.id}`}
                aria-selected={selectedStage}
                aria-controls="stage-explorer-posts"
                className={selectedStage ? 'stage-explorer-card is-active' : 'stage-explorer-card'}
                key={stage.id}
                onClick={() => setActiveId(stage.id)}
              >
                <span className="stage-explorer-copy">
                  <small>{stage.eyebrow}</small>
                  <strong>{stage.title}</strong>
                  <span>{stage.description}</span>
                </span>
                <StageIcon id={stage.id} />
              </button>
            )
          })}
        </div>

        <div
          className="stage-explorer-result"
          id="stage-explorer-posts"
          role="tabpanel"
          aria-labelledby={`stage-tab-${active.id}`}
        >
          <div className="stage-explorer-result-head">
            <div>
              <span>{active.resultLabel}</span>
              <h3>먼저 확인할 글 {selected.length}편</h3>
            </div>
            <Link href={`${SITE.basePath}/`}>전체 글 보기</Link>
          </div>

          <div className="stage-explorer-posts">
            {selected.map((post, index) => (
              <article className={index === 0 ? 'stage-post is-first' : 'stage-post'} key={post.slug}>
                <Link href={`${SITE.basePath}/${encodeURIComponent(post.slug)}/`}>
                  <span className="stage-post-copy">
                    <small>{index === 0 ? '먼저 읽기' : post.category}</small>
                    <strong>{post.title}</strong>
                  </span>
                  {post.coverImage && (
                    <span className="stage-post-visual" aria-hidden="true">
                      {/* 정적 export라 next/image 최적화를 쓰지 않는다. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.coverImage} alt="" loading="lazy" decoding="async" />
                    </span>
                  )}
                  <i aria-hidden="true">→</i>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
