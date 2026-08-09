'use client'

import { ORG } from '@/config/site'
import { 사건보내기 } from '@/lib/analytics'

/**
 * 글쓴이 소개 페이지의 상담 버튼.
 *
 * 이 페이지에는 그동안 이 팀에게 닿을 방법이 없었다. 소개를 읽고
 * 「여기에 맡기고 싶다」가 된 사람이 갈 곳이 글 목록뿐이었다.
 *
 * 채팅 위젯을 쓰지 않으므로 홈페이지의 견적·상담 문의 페이지로 보낸다.
 * 글에서 누른 것과 구분해야 하므로 자리를 「팀소개」로 남긴다.
 */
export function MemberConsult({ name, fields }: { name: string; fields: string[] }) {
  return (
    <a
      className="member-btn"
      href={`${ORG.url}/request`}
      onClick={() =>
        사건보내기('consult_click', {
          post_slug: `members/${name}`,
          post_category: fields[0] ?? '',
          cta_slot: '팀소개',
          cta_method: '링크',
        })
      }
    >
      상담 문의
    </a>
  )
}
