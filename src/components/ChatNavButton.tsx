import { ORG } from '@/config/site'

/**
 * 상단 고정 문의 버튼. 홈페이지의 견적·상담 문의 페이지로 보낸다.
 *
 * 도원 블로그에서는 채널톡 상담창을 열었지만, 여기는 채팅 위젯을 쓰지 않아
 * 문의 페이지 링크로 둔다. 나중에 채널톡을 붙이면 CHANNEL.pluginKey 를 채우고
 * 이 컴포넌트를 원래 버튼으로 되돌리면 된다.
 */
export function ChatNavButton() {
  return (
    <a className="nav-cta" href={`${ORG.url}/request`}>
      견적·상담 문의
    </a>
  )
}
