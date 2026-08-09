import { toolFor } from '@/config/site'
import { withSource } from '@/lib/seo'

/**
 * 글 끝에 붙는 자가진단 도구.
 *
 * 글을 다 읽고 나면 "그래서 우리 회사는?"이 남는다. 그때 사람에게 묻기 전에
 * 혼자 눌러볼 수 있는 곳을 준다. 상담보다 문턱이 낮아서 먼저 여기로 들어오고,
 * 진단 결과가 나오면 그 화면에서 자연스럽게 상담으로 이어진다.
 *
 * 붙는 도구는 글의 카테고리로 정해진다. 글마다 따로 지정하지 않는다.
 */
export function ToolCallout({
  pick,
  category,
  slug,
}: {
  pick: string
  category: string
  slug: string
}) {
  const tool = toolFor(pick, category)
  if (!tool) return null

  return (
    <aside className="tool-callout">
      <span className="tool-icon" aria-hidden="true">
        {tool.icon}
      </span>
      <p className="tool-label">직접 확인해보세요</p>
      <p className="tool-name">{tool.name}</p>
      <p className="tool-desc">{tool.desc}</p>
      <a
        className="tool-link"
        href={withSource(tool.href, slug, category)}
        target="_blank"
        rel="noopener"
      >
        바로 진단하기
      </a>
    </aside>
  )
}
