import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { listPosts } from '@/lib/content'
import { CATEGORY_OWNERS, MEMBERS, ORG, SITE, member, memberLabel } from '@/config/site'
import { sectionUrl } from '@/lib/seo'
import { encodePath } from '@/lib/slug'
import { JsonLd } from '@/components/JsonLd'
import { PostCard } from '@/components/PostCard'
import { MemberConsult } from '@/components/MemberConsult'
import { imageAttrs } from '@/lib/imageAttrs'

type Params = { params: Promise<{ name: string }> }

export const dynamicParams = false

export async function generateStaticParams() {
  return Object.keys(MEMBERS).map((name) => ({ name }))
}

/**
 * 「現」「前」을 왼쪽 칸으로 뽑는다.
 *
 * 데이터에 이미 붙어 있는데 문장 앞에 묻혀 있어 눈에 걸리지 않았다.
 * 칸을 나눠 두면 지금 하는 일과 지나온 일이 훑기만 해도 갈린다.
 * 머리표가 없는 줄(학교 등)은 그 칸을 비워 두어 글이 같은 선에서 시작한다.
 */
function MemberLine({ text }: { text: string }) {
  const m = /^(現|前)\s+(.*)$/.exec(text)
  return (
    <li>
      <b aria-hidden={m ? undefined : 'true'}>{m ? m[1] : ''}</b>
      <span>{m ? m[2] : text}</span>
    </li>
  )
}

/** 이 사람이 맡은 카테고리. 담당 표에서 거꾸로 찾는다. */
function fieldsOf(name: string): string[] {
  return Object.entries(CATEGORY_OWNERS)
    .filter(([, pool]) => pool.includes(name))
    .map(([category]) => category)
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { name } = await params
  const decoded = decodeURIComponent(name)
  if (!MEMBERS[decoded]) return {}

  const info = member(decoded)
  const fields = fieldsOf(decoded)
  const title = memberLabel(decoded)
  const description = fields.length
    ? `${decoded}입니다. ${fields.join(', ')} 분야의 글을 씁니다.`
    : `${decoded} 명의로 발행한 3D프린팅 실무 글입니다.`

  return {
    title,
    description,
    alternates: { canonical: sectionUrl('members', decoded) },
  }
}

export default async function MemberPage({ params }: Params) {
  const { name } = await params
  const decoded = decodeURIComponent(name)
  if (!MEMBERS[decoded]) notFound()

  const info = member(decoded)
  const fields = fieldsOf(decoded)
  const all = await listPosts()
  const posts = all.filter((p) => p.author === decoded)

  return (
    <>
      {/* 노무는 구글이 작성자 전문성을 특히 엄격하게 보는 분야다.
          사람 한 명을 실체 있는 개체로 선언해 두면 글 단위 신뢰도가 함께 올라간다. */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          url: sectionUrl('members', decoded),
          mainEntity: {
            '@type': 'Person',
            name: decoded,
            jobTitle: info.title,
            ...(info.team ? { department: { '@type': 'Organization', name: info.team } } : {}),
            worksFor: { '@type': 'Organization', name: ORG.name, url: ORG.url },
            ...(fields.length ? { knowsAbout: fields } : {}),
            ...(info.school ? { alumniOf: { '@type': 'EducationalOrganization', name: info.school } } : {}),
            ...(info.photo ? { image: `${SITE.url}${encodePath(info.photo)}` } : {}),
          },
        }}
      />

      <div className="layout layout-solo layout-wide">
        <div className="layout-main">
          <nav className="crumbs" aria-label="현재 위치">
            <Link href={`${SITE.basePath}/`}>{SITE.name}</Link>
            <span aria-hidden="true"> › </span>
            <Link href={`${SITE.basePath}/members/`}>글쓴이</Link>
          </nav>

          <section className="member-hero">
            {info.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="member-photo" {...imageAttrs(info.photo)} alt="" />
            ) : (
              <span className="member-initial member-initial-lg" aria-hidden="true">
                {decoded.slice(0, 1)}
              </span>
            )}
            <div className="member-id">
              <p className="member-org">
                {ORG.name}
                {info.team ? ` · ${info.team}` : ''}
              </p>
              {/* 직함을 이름 위에 작게 얹는다. 「공인노무사 이승은」을 한 줄로 쓰면
                  이름이 직함에 묻힌다. 이 바닥의 명함 표기도 직함이 위다. */}
              <h1>
                <span>{info.title}</span>
                {decoded}
              </h1>
              {fields.length > 0 && (
                <p className="member-fields">
                  {fields.map((f, i) => (
                    <span key={f}>
                      {i > 0 && <i aria-hidden="true">·</i>}
                      {f}
                    </span>
                  ))}
                </p>
              )}
              <p className="member-act">
                <MemberConsult name={decoded} fields={fields} />
                <span className="member-count">
                  이 사이트에 쓴 글 <b>{posts.length}</b>편
                </span>
              </p>
            </div>
          </section>

          {info.career && info.career.length > 0 && (
            <section className="member-sec" aria-label="주요 경력">
              <h2>주요 경력</h2>
              <ul className="member-lines">
                {info.career.map((x) => (
                  <MemberLine key={x} text={x} />
                ))}
                {info.school && <MemberLine text={info.school} />}
              </ul>
            </section>
          )}

          {info.activities && info.activities.length > 0 && (
            <section className="member-sec" aria-label="대외 활동">
              <h2>대외 활동</h2>
              <ul className="member-lines">
                {info.activities.map((x) => (
                  <MemberLine key={x} text={x} />
                ))}
              </ul>
            </section>
          )}

          {info.work && info.work.length > 0 && (
            <section className="member-sec" aria-label="수행 업무">
              <h2>수행 업무</h2>
              <ul className="member-lines member-lines-two">
                {info.work.map((x) => (
                  <MemberLine key={x} text={x} />
                ))}
              </ul>
            </section>
          )}

          {posts.length > 0 ? (
            <h2 className="member-posts-title">{decoded}의 글</h2>
          ) : null}

          {posts.length > 0 ? (
            <div className="card-grid">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <p className="member-empty">
              아직 발행된 글이 없습니다. 다른 글은{' '}
              <Link href={`${SITE.basePath}/`}>전체 글</Link>에서 보실 수 있습니다.
            </p>
          )}
        </div>
      </div>
    </>
  )
}
