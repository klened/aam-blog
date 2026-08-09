import type { Metadata } from 'next'
import Link from 'next/link'
import { ANALYTICS, LOGO, ORG, SITE, VERIFY } from '@/config/site'
import { SHOW_DRAFTS } from '@/lib/drafts'
import { listCategories } from '@/lib/content'
import { imageSrc } from '@/lib/imageSize'
import { ChatNavButton } from '@/components/ChatNavButton'
import { CategoryMenu } from '@/components/CategoryMenu'
// 글자체를 먼저 물린다. 파일과 이유는 fonts.css 머리말에 적어 두었다.
import './fonts.css'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${ORG.name}`,
    template: `%s | ${ORG.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    locale: SITE.locale,
  },
  // 검수·초안이 보이는 배포(검토용 브랜치)는 검색에 잡히면 안 된다.
  // 같은 글이 두 주소에 존재하면 중복 문서가 되어 실제 사이트 순위를 깎는다.
  robots: SHOW_DRAFTS ? { index: false, follow: false } : { index: true, follow: true },
  // 서치콘솔·서치어드바이저 소유 확인. 값이 없으면 태그가 나가지 않는다.
  ...(VERIFY.google || VERIFY.naver
    ? {
        verification: {
          ...(VERIFY.google ? { google: VERIFY.google } : {}),
          ...(VERIFY.naver ? { other: { 'naver-site-verification': VERIFY.naver } } : {}),
        },
      }
    : {}),
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 분야 목록은 글 파일에서 세므로 빌드할 때 정해진다. 머리글에 두면 글을
  // 읽는 중에도 다른 분야로 넘어갈 수 있다. 목록의 왼쪽 사이드바는 그대로다.
  const categories = await listCategories()

  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <div className="header-left">
              <a className="brand" href={ORG.url}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="brand-logo"
                  src={imageSrc(LOGO.src)}
                  alt={ORG.name}
                  width={LOGO.width}
                  height={LOGO.height}
                />
                <span className="brand-sep" aria-hidden="true">
                  |
                </span>
                <span className="brand-sub">3D프린팅 인사이트</span>
              </a>
            </div>

            {/* 「서비스 안내」와 「네이버 블로그」는 뺐다. 회사 홈페이지로는 왼쪽
                로고가 이미 이어지고, 네이버 블로그는 여기서 나가는 길이라
                애써 데려온 사람을 다른 사이트로 내보내는 자리였다.
                두 곳 모두 바닥글에는 그대로 있다. */}
            <nav className="header-nav" aria-label="주요 메뉴">
              <Link href={`${SITE.basePath}/`}>전체 글</Link>
              <CategoryMenu categories={categories} />
              <ChatNavButton />
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="site-footer">
          <div className="footer-inner">
            <div>
              <p className="footer-org">{ORG.name}</p>
              <p className="footer-desc">{ORG.description}</p>
            </div>
            <p className="footer-links">
              <a href={`${ORG.url}/`}>홈페이지</a>
              <span aria-hidden="true"> · </span>
              <a href={`${ORG.url}/request`}>견적·상담 문의</a>
              <span aria-hidden="true"> · </span>
              <a href={`${SITE.basePath}/rss.xml`}>RSS</a>
            </p>
          </div>
        </footer>
        {/* 방문자 분석. 검토용 배포와 개발 서버에서는 넣지 않는다.
            검토하느라 들락거린 것이 실제 방문 수에 섞이면 숫자를 믿을 수 없게 된다. */}
        {!SHOW_DRAFTS && ANALYTICS.beaconToken && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${ANALYTICS.beaconToken}"}`}
          />
        )}
        {/* Google 애널리틱스. Cloudflare 를 대신하는 것이 아니라 함께 둔다.
            글 아래 「지금 인기있는 글」이 Cloudflare 쪽 기록을 쓰기 때문이다.
            둘의 숫자가 조금 다른 것은 정상이다. 세는 방식이 다르다. */}
        {!SHOW_DRAFTS && ANALYTICS.gaId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS.gaId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ANALYTICS.gaId}');`,
              }}
            />
          </>
        )}
      </body>
    </html>
  )
}
