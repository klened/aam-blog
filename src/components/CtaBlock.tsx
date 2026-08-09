'use client'

import { CTA_PRESETS, ORG, TEAM_PHOTO, type CtaKey, TEAM_PHOTO_SIZE } from '@/config/site'
import { 사건보내기 } from '@/lib/analytics'
import { withSource } from '@/lib/seo'
import { openChannelChat } from './ChannelTalk'

/**
 * 전환 장치.
 *
 * `variant="inline"`은 본문 중간에 들어가는 가벼운 형태다.
 * 긴 글은 끝까지 읽는 사람이 절반도 되지 않아서, 하단 CTA 하나만으로는
 * 접점이 부족하다.
 */
export function CtaBlock({
  type,
  slug,
  category,
  title,
  variant = 'block',
  ask,
  photoSrc,
}: {
  type: string
  slug: string
  category: string
  title: string
  variant?: 'block' | 'inline'
  /**
   * 이 글에 딱 맞는 문구. 마지막 자주 묻는 질문이 상담 요청이면 그 답을
   * 떼어 여기로 올린다. 「무엇을 알려 주시면 무엇을 짚어 드립니다」라 238편
   * 공통 문구보다 훨씬 구체적이다. 없으면 공통 문구를 쓴다.
   */
  ask?: string
  /** 캐시 표식이 붙은 단체사진 주소. 서버 쪽에서 imageSrc 로 만들어 넘긴다. */
  photoSrc?: string
}) {
  if (type === '없음') return null

  const key = (Object.keys(CTA_PRESETS) as CtaKey[]).includes(type as CtaKey)
    ? (type as CtaKey)
    : '채팅상담'
  const preset = CTA_PRESETS[key]
  const message = `[${category || '문의'}] "${title}" 글을 보고 문의드립니다.\n\n필요한 부품·용도는 이렇습니다: `

  /**
   * 어느 글의 어느 자리에서 눌렀는지까지 남긴다.
   *
   * 「상담이 몇 건」만 세면 다음에 무엇을 쓸지 정하는 데 쓸 수 없다. 어느
   * 글이 문의를 만들었는지가 나와야 그 주제를 더 쓸지 판단할 수 있다.
   * 본문 중간(inline)과 글 끝(block) 중 어디가 먹히는지도 여기서 갈린다.
   *
   * **이름과 매개변수 키는 영문·숫자·밑줄로 쓴다.** 처음에 「상담_클릭」에
   * 「글·분류·자리·방식」으로 보냈더니 실시간 보고서에 아예 잡히지 않았다.
   * GA4 는 이름이 문자로 시작하고 영숫자와 밑줄만 쓰도록 되어 있어 조용히
   * 버려진다. 오류가 안 나서 보낸 쪽에서는 성공한 것처럼 보인다.
   *
   * 값은 한글이어도 된다. 걸리는 것은 키뿐이다.
   */
  const 눌렸다 = () =>
    사건보내기('consult_click', {
      post_slug: slug,
      post_category: category,
      cta_slot: variant === 'inline' ? '본문중간' : '글끝',
      cta_method: preset.chat ? '채팅' : '링크',
    })

  if (variant === 'inline') {
    return (
      <aside className="cta-inline">
        <p className="cta-inline-text">
          우리 부품도 가능한지 궁금하시면 지금 물어보세요. 용도와 조건만 알려주시면 담당
          엔지니어가 확인해 드립니다.
        </p>
        {preset.chat ? (
          <button
            type="button"
            className="cta-inline-btn"
            onClick={() => {
              눌렸다()
              openChannelChat(message)
            }}
          >
            바로 물어보기
          </button>
        ) : (
          <a
            className="cta-inline-btn"
            href={withSource(preset.href, slug, category)}
            onClick={눌렸다}
          >
            {preset.buttonText}
          </a>
        )}
      </aside>
    )
  }

  return (
    <aside className="cta-block">
      {/* 얼굴이 보이면 '어딘가의 폼'이 아니라 '사람에게 묻는 일'이 된다. */}
      <figure className="cta-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* 사진 아래 설명은 두지 않는다. 바로 아래 문구와 글 끝 작성 정보에서
            이미 누가 답하는지 밝히고 있어 같은 말이 세 번 나온다. */}
        {/* 주소는 서버에서 만들어 넘겨받는다. 여기는 클라이언트 컴포넌트라
            파일을 읽을 수 없어 캐시 표식을 직접 붙이지 못한다. 넘어오지
            않으면 표식 없는 주소로 나가고, 사진을 바꿔도 이미 본 사람에게는
            한동안 예전 것이 보인다. */}
        <img
          src={photoSrc || TEAM_PHOTO}
          width={TEAM_PHOTO_SIZE.width}
          height={TEAM_PHOTO_SIZE.height}
          alt={`${ORG.name} 3D프린팅 솔루션`}
          loading="lazy"
          decoding="async"
        />
      </figure>

      {/* 제목이 비어 있으면 아예 그리지 않는다. 빈 문단만 남으면 사진과
          문장 사이가 벌어져 무엇이 빠진 자리처럼 보인다. */}
      {preset.heading && <p className="cta-heading">{preset.heading}</p>}
      <p className="cta-body">{ask || preset.body}</p>

      {preset.chat ? (
        <button
          type="button"
          className="cta-button"
          onClick={() => {
            눌렸다()
            openChannelChat(message)
          }}
        >
          {preset.buttonText}
        </button>
      ) : (
        <a
          className="cta-button"
          href={withSource(preset.href, slug, category)}
          onClick={눌렸다}
        >
          {preset.buttonText}
        </a>
      )}
    </aside>
  )
}
