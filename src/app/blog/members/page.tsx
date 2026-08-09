import type { Metadata } from 'next'
import Link from 'next/link'
import { listPosts } from '@/lib/content'
import { CATEGORY_OWNERS, MEMBERS, ORG, SITE, memberLabel } from '@/config/site'
import { sectionUrl } from '@/lib/seo'
import { JsonLd } from '@/components/JsonLd'
import { imageAttrs } from '@/lib/imageAttrs'

const TITLE = '글쓴이 소개'
const DESC = `${ORG.name}에서 이 사이트의 글을 쓰는 팀입니다. 분야별 담당과 쓴 글을 함께 보실 수 있습니다.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: sectionUrl('members') },
}

export default async function MemberIndexPage() {
  const posts = await listPosts()

  const rows = Object.entries(MEMBERS).map(([name, info]) => ({
    name,
    ...info,
    fields: Object.entries(CATEGORY_OWNERS)
      .filter(([, pool]) => pool.includes(name))
      .map(([category]) => category),
    count: posts.filter((p) => p.author === name).length,
    // 담당 카테고리가 없는 사람은 대표 수행 업무 한 줄로 대신한다.
    line: info.career?.[0]?.replace(/^現\s*/, '') ?? '',
  }))

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: TITLE,
          description: DESC,
          url: sectionUrl('members'),
          publisher: { '@type': 'Organization', name: ORG.name, url: ORG.url },
        }}
      />

      <div className="layout layout-solo layout-wide">
        <div className="layout-main">
          <nav className="crumbs" aria-label="현재 위치">
            <Link href={`${SITE.basePath}/`}>{SITE.name}</Link>
            <span aria-hidden="true"> › </span>
            <span>글쓴이</span>
          </nav>

          <section className="list-hero">
            <h1>{TITLE}</h1>
            <p>
              글마다 담당자가 정해져 있습니다. 읽으신 글을 쓴 사람이 문의를 받았을 때
              실제로 답하는 사람입니다.
            </p>
          </section>

          <ul className="member-list">
            {rows.map((m) => (
              <li key={m.name}>
                <Link href={`${SITE.basePath}/members/${encodeURIComponent(m.name)}/`}>
                  <span className="member-photo">
                    {m.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                      {...imageAttrs(m.photo)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                    ) : (
                      <span className="member-initial" aria-hidden="true">
                        {m.name.slice(0, 1)}
                      </span>
                    )}
                  </span>
                  <span className="member-list-body">
                    <strong>{memberLabel(m.name)}</strong>
                    <span className="member-list-fields">
                      {m.fields.length > 0 ? m.fields.join(' · ') : m.line}
                    </span>
                    <span className="member-list-count">글 {m.count}편</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  )
}
