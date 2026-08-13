import { ORG } from '@/config/site'

/**
 * 상단 고정 문의 버튼. 홈페이지의 견적·상담 문의 페이지로 보낸다.
 *
 * 좁은 화면에서는 앞말을 감춰 「문의」만 남긴다. 통째로 두면 머리글이 화면을
 * 넘어가 단추가 잘린다. 감추는 것은 CSS 가 하고, 글자는 화면에서만 사라지므로
 * 화면을 못 보는 사람에게는 「견적·상담 문의」가 그대로 읽힌다.
 */
export function ChatNavButton() {
  return (
    <a className="nav-cta" href={`${ORG.url}/request`}>
      <span className="nav-cta-long">견적·상담 </span>문의
    </a>
  )
}
