import type { Metadata } from 'next'
import Link from 'next/link'
import { ORG, SITE, TOOLS } from '@/config/site'
import { sectionUrl, withSource } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'

const TITLE = '노무 자가진단·계산기'
const DESC =
  '산재 승인 가능성, 받을 수 있는 지원금, 직장 내 괴롭힘 조사 의무를 직접 확인해보실 수 있습니다. 노무법인 도원이 만든 자가진단 도구를 한곳에 모았습니다.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: sectionUrl('자가진단') },
}

export default function ToolsPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: TITLE,
          description: DESC,
          url: sectionUrl('자가진단'),
          publisher: { '@type': 'Organization', name: ORG.name, url: ORG.url },
        }}
      />

      <div className="layout layout-solo">
        <div className="layout-main">
          <nav className="crumbs" aria-label="현재 위치">
            <Link href={`${SITE.basePath}/`}>{SITE.name}</Link>
            <span aria-hidden="true"> › </span>
            <span>자가진단</span>
          </nav>

          <section className="list-hero">
            <h1>{TITLE}</h1>
            <p>
              글을 읽고 나면 결국 남는 질문은 하나입니다. 그래서 우리 회사는 어떤가.
              아래 도구로 먼저 확인해보시고, 판단이 서지 않으면 그때 물어보셔도 됩니다.
            </p>
          </section>

          <ul className="tool-list">
            {TOOLS.map((t) => (
              <li key={t.href}>
                <a href={withSource(t.href, '자가진단', '')} target="_blank" rel="noopener">
                  <span className="tool-icon" aria-hidden="true">
                    {t.icon}
                  </span>
                  <strong>{t.name}</strong>
                  <span className="tool-desc">{t.desc}</span>
                  <span className="tool-arrow" aria-hidden="true">
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <p className="tool-foot">
            진단 결과만으로 판단이 어려우면 <Link href={`${SITE.basePath}/`}>관련 글</Link>을 함께
            보시거나, 오른쪽 아래 상담창으로 사업장 상황을 알려주세요. 담당 공인노무사가 직접
            확인하고 답해드립니다.
          </p>
        </div>
      </div>
    </>
  )
}
