import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { anchorsOf, getPost, listPosts, pickForFooter, PLACEHOLDER_SLUG } from '@/lib/content'
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, formatDate, postUrl } from '@/lib/seo'
import { SITE, categoryIcon, coverFor, memberAvatar, memberLabel, TEAM_PHOTO } from '@/config/site'
import { categorySlug } from '@/lib/content'
import { JsonLd } from '@/components/JsonLd'
import { PostBody } from '@/components/PostBody'
import { Toc } from '@/components/Toc'
import { CtaBlock } from '@/components/CtaBlock'
import { HookBlock } from '@/components/HookBlock'
import { RelatedPosts } from '@/components/RelatedPosts'
import { PostBrief } from '@/components/PostBrief'
import { dropConsultFaq, pullConsultAsk, pullWarnBox, splitFaq } from '@/lib/markdown'
import { ToolCallout } from '@/components/ToolCallout'
import { ChannelTalk } from '@/components/ChannelTalk'
import { imageAttrs } from '@/lib/imageAttrs'
import { imageSrc } from '@/lib/imageSize'

type Params = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export async function generateStaticParams() {
  const posts = await listPosts()
  if (posts.length === 0) {
    console.warn(
      '[content] 발행된 글이 없습니다. content/posts/*.md 에서 상태를 "발행"으로 바꾸면 됩니다.'
    )
    return [{ slug: PLACEHOLDER_SLUG }]
  }
  // 슬러그는 디코딩된 한글 그대로 넘긴다.
  // 인코딩해서 넘기면 out/blog/%EC%82%B0... 처럼 폴더명이 깨진다.
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const decoded = decodeURIComponent(slug)
  if (decoded === PLACEHOLDER_SLUG) {
    return { title: '준비 중', robots: { index: false, follow: false } }
  }
  const post = await getPost(decoded)
  if (!post) return {}

  const { meta, description } = post
  const url = postUrl(meta.slug)

  return {
    title: meta.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: meta.title,
      description,
      url,
      publishedTime: meta.publishedAt,
      modifiedTime: meta.updatedAt || meta.publishedAt,
      ...(meta.coverImage ? { images: [{ url: meta.coverImage }] } : {}),
    },
    ...(meta.tags.length ? { keywords: meta.tags } : {}),
  }
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params
  const decoded = decodeURIComponent(slug)

  if (decoded === PLACEHOLDER_SLUG) {
    return (
      <div className="layout layout-solo">
        <div className="layout-main">
          <section className="list-hero">
            <h1>글을 준비하고 있습니다</h1>
            <p>
              아직 발행된 글이 없습니다. <code>content/posts/</code> 폴더의 글에서 상태를
              &lsquo;발행&rsquo;으로 바꾸면 이 자리에 글이 나타납니다.
            </p>
          </section>
        </div>
      </div>
    )
  }

  const post = await getPost(decoded)
  if (!post) notFound()

  const { meta, content, toc, faqs, description } = post
  const all = await listPosts()
  const { posts: related, ranked } = pickForFooter(all, meta, 3)
  // 제목 아래에 쓸 날짜. 고쳐 쓴 글은 고친 날이 최신이다.
  const latestDate =
    meta.updatedAt && meta.updatedAt > meta.publishedAt ? meta.updatedAt : meta.publishedAt

  // 자주 묻는 질문은 본문에서 떼어 글 맨 아래 「함께 읽으면 좋은 글」 위에 둔다.
  // 글 끝에 그대로 두면 본문을 다 읽은 사람이 문의를 만나기 전에 질문 열댓 줄을
  // 더 지나게 된다. FAQ 는 언제나 글의 마지막 대제목이라 뒤쪽 조각에서 찾는다.
  const 본문뒷조각 = content.kind === 'notion' ? '' : content.tail || content.html
  const { faq: 질문전체, rest: 질문뺀본문 } = splitFaq(본문뒷조각)
  // 마지막 질문이 상담 요청이면 그 답을 떼어 버튼 옆으로 올린다. 그 글에 딱 맞는
  // 문구가 이미 거기 적혀 있는데 페이지 맨 아래 접힌 채로 두고 있었다.
  const { faq, ask } = pullConsultAsk(질문전체)
  // 본문의 주의 상자를 떼어 글 끝 「마지막으로 짚을 것」에 합친다. 테두리 있는
  // 상자가 한 화면에 둘이면 둘 다 흘려 읽히는데, 하는 말도 이어져 있었다.
  // 대개 글 뒤쪽에 두지만 앞쪽에 둔 글이 두 편 있어 앞 조각도 본다.
  const 앞원본 = content.kind === 'notion' ? '' : content.head
  const 뒷조각 = pullWarnBox(질문뺀본문)
  const 앞조각 = 뒷조각.warn ? { html: 앞원본, warn: null } : pullWarnBox(앞원본)
  const 주의 = 뒷조각.warn ?? 앞조각.warn

  return (
    <>
      <JsonLd data={articleJsonLd(meta, description)} />
      <JsonLd data={breadcrumbJsonLd(meta)} />
      <JsonLd data={faqJsonLd(dropConsultFaq(faqs))} />

      <ChannelTalk
        context={{
          postTitle: meta.title,
          postCategory: meta.category,
          postSlug: meta.slug,
          postUrl: postUrl(meta.slug),
        }}
      />

      <div className="layout">
        <aside className="layout-side">
          <Toc items={toc} depth={2} />
        </aside>

        <article className="layout-main post">
          {meta.status !== '발행' && (
            <p className="draft-notice">
              이 글은 <strong>{meta.status}</strong> 상태입니다. 검토용 화면에서만 보이고 실제
              사이트에는 나가지 않습니다.
            </p>
          )}

          {/* 제목 위에는 아무것도 두지 않는다. 현재 위치와 분류 딱지를 얹어 두면
              정작 가장 중요한 제목이 세 번째 줄로 밀린다. 분류는 제목 아래
              작은 줄로 내렸다. 거기가 이 글에서 카테고리로 가는 유일한 길이다. */}

          {/* 글 제목이 이 페이지의 유일한 h1이다. 본문 제목은 모두 h2 이하로 내려간다. */}
          <h1 className="post-title">{meta.title}</h1>

          {/* 제목이 못 담는 검색어를 여기서 받는다. 제목은 한 줄이라 「심사청구」
              「재심사청구」「행정소송」을 다 넣으면 읽히지 않는데, 부제로 내리면
              제목은 짧게 두면서 무엇을 다루는 글인지가 분명해진다. */}
          {meta.subtitle && <p className="post-subtitle">{meta.subtitle}</p>}

          <p className="post-meta">
            {/* 제목 아래에는 가장 최근 날짜 하나만 둔다. 두 개를 나란히 두면
                읽는 사람이 어느 쪽을 봐야 하는지 잠깐 멈칫한다.
                최초 발행일과 최종 수정일은 글 끝 작성 정보에 그대로 남는다. */}
            {meta.category && (
              <>
                <Link
                  className="post-cat"
                  href={`${SITE.basePath}/category/${encodeURIComponent(categorySlug(meta.category))}/`}
                >
                  <i aria-hidden="true">{categoryIcon(meta.category)}</i>
                  {meta.category}
                </Link>
                <span aria-hidden="true"> · </span>
              </>
            )}
            <time dateTime={latestDate}>{formatDate(latestDate)}</time>
            {meta.author && (
              <>
                <span aria-hidden="true"> · </span>
                <Link
                  className="post-author"
                  href={`${SITE.basePath}/members/${encodeURIComponent(meta.author)}/`}
                >
                  {/* 얼굴은 이름 바로 앞에 붙인다. 따로 떼어 놓으면 장식으로 보이지만
                      이름에 붙어 있으면 누가 쓴 글인지를 알리는 표시로 읽힌다.
                      글자 높이 안에 들어가는 크기라 본문이 아래로 밀리지 않는다. */}
                  {memberAvatar(meta.author) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="post-author-face"
                      {...imageAttrs(memberAvatar(meta.author)!)}
                      alt=""
                      decoding="async"
                    />
                  ) : (
                    <span className="post-author-face is-initial" aria-hidden="true">
                      {meta.author.slice(0, 1)}
                    </span>
                  )}
                  {memberLabel(meta.author)}
                </Link>
              </>
            )}
            {meta.readingMinutes > 0 && (
              <>
                <span aria-hidden="true"> · </span>
                <span>{meta.readingMinutes}분 분량</span>
              </>
            )}
          </p>

          {/* 검색으로 들어온 사람은 답을 찾으러 온 것이지 사진을 보러 온 게 아니다.
              요약을 사진보다 먼저 둔다. */}
          <PostBrief reader={meta.reader} gain={meta.gain} points={meta.keyPoints} />

          {/* 글에 적힌 대표이미지가 없으면 카테고리에 맞는 기본 사진을 쓴다.
              옮겨 온 글 가운데 사진이 없는 것이 나오는데, 빈 자리로 두면 글이
              허전하다. 다만 기본 사진은 주제를 설명하지 않으므로 주제가 드러나는
              사진이 있으면 글의 `대표이미지` 에 적는 편이 언제나 낫다. */}
          <figure className="post-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              {...imageAttrs(coverFor(meta.coverImage, meta.category))}
              alt={meta.coverAlt}
              decoding="async"
            />
          </figure>

          {/* 좁은 화면에서는 목차가 8줄까지 늘어나 본문을 밀어낸다. 눌렀을 때만 편다. */}
          <details className="toc-inline">
            <summary>이 글의 목차</summary>
            <Toc items={toc} />
          </details>

          <div className="post-content">
            {content.kind === 'notion' ? (
              <PostBody blocks={content.blocks} anchors={anchorsOf(content)} />
            ) : content.tail ? (
              <>
                <div dangerouslySetInnerHTML={{ __html: 앞조각.html }} />
                <CtaBlock
                  type={meta.cta}
                  slug={meta.slug}
                  category={meta.category}
                  title={meta.title}
                  variant="inline"
                />
                <div dangerouslySetInnerHTML={{ __html: 뒷조각.html }} />
              </>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: 뒷조각.html }} />
            )}
          </div>

          <ToolCallout pick={meta.tool} category={meta.category} slug={meta.slug} />
          {/* 도구 다음, 버튼 바로 위에 둔다. 글의 결론으로 읽히면서 버튼으로 이어진다. */}
          <HookBlock category={meta.category} target={meta.target} warn={주의} />
          <CtaBlock
            type={meta.cta}
            slug={meta.slug}
            category={meta.category}
            title={meta.title}
            ask={ask}
            photoSrc={imageSrc(TEAM_PHOTO)}
          />

          {faq && (
            <section className="post-faq" dangerouslySetInnerHTML={{ __html: faq }} />
          )}

          <RelatedPosts posts={related} ranked={ranked} />
        </article>
      </div>
    </>
  )
}
