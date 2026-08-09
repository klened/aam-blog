import { categoryHook } from '@/config/site'
import type { WarnBox } from '@/lib/markdown'

/**
 * 문단 안의 **강조**만 살린다.
 *
 * 마크다운 변환기를 부르지 않는다. 여기 들어오는 글은 우리가 직접 적은
 * 두 문단뿐이고 링크도 목록도 없다. 파서를 붙이면 그만큼 깨질 자리만 는다.
 * 값이 HTML 로 나가므로 태그가 될 만한 글자는 먼저 막는다.
 */
function 강조만(글: string): string {
  return 글
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

/**
 * 글을 맺는 상자. 본문의 주의 상자와 후킹 문단을 하나로 합쳤다.
 *
 * 버튼 옆이 아니라 본문 끝에 둔다. 같은 문장이라도 버튼 옆에 있으면 광고로
 * 읽히고 본문 끝에 있으면 글의 결론으로 읽힌다. 위치가 신뢰를 정한다.
 *
 * **주의 상자가 있으면 짚기를 쓰지 않는다.** 이것이 이 부품의 핵심이다.
 *
 * 셋을 그냥 쌓아 두었더니 붙여 놓기만 한 티가 났다. 짚기가 전부
 * 「…라고 보시기 쉽습니다」로 시작하는데, 이건 처음부터 다시 여는 문장이다.
 * 바로 앞에서 이 글에 딱 맞는 경고를 읽은 사람을 일반론으로 되감는다.
 * 게다가 짚기가 하는 일이 원래 「어디가 어려운지 짚기」라, 주의 상자와
 * 같은 말을 한 번은 구체적으로 한 번은 두루뭉술하게 두 번 하게 된다.
 *
 * 빼고 나면 저절로 이어진다. 제안이 전부 「그래서 저희는」으로 시작하는
 * 받는 문장이기 때문이다. **이 글에서 조심할 것 → 그래서 저희는 이것을
 * 봅니다 → 이렇게 물어보시면 됩니다**가 한 문단처럼 읽히고, 그 끝이 바로
 * 상담 버튼이다. 사이에 선을 긋지 않는 이유도 같다. 선을 그으면 「그래서」가
 * 받을 것을 잃는다.
 *
 * 주의 상자가 없는 15편에서는 짚기가 제안을 여는 유일한 문단이라 그대로 쓴다.
 *
 * **라벨은 명사형으로 짧게 붙인다.** 「여기서 갈립니다」처럼 문장으로 두었더니
 * 주장처럼 읽혀 상자가 광고 쪽으로 기울었다. 글머리의 「핵심만 먼저」처럼
 * 이름표로 두면 글의 한 부분으로 읽힌다.
 *
 * 둘 다 없으면 아무것도 그리지 않는다. 어설픈 일반론을 붙이면 바로 아래
 * CTA 까지 광고로 읽힌다.
 */
export function HookBlock({
  category,
  target,
  warn,
}: {
  category: string
  target: string
  warn?: WarnBox | null
}) {
  const hook = categoryHook(category, target)
  if (!hook && !warn) return null

  return (
    <aside className="warn-box post-hook">
      <p className="callout-label">마지막으로 짚을 것</p>
      {warn?.title && <p className="callout-title">{warn.title}</p>}
      <div className="callout-body">
        {warn && <div dangerouslySetInnerHTML={{ __html: warn.body }} />}
        {hook && !warn && <p dangerouslySetInnerHTML={{ __html: 강조만(hook.짚기) }} />}
        {hook && <p dangerouslySetInnerHTML={{ __html: 강조만(hook.제안) }} />}
      </div>
    </aside>
  )
}
