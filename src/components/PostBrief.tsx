/**
 * 글머리 요약 카드.
 *
 * 누구를 위한 글인지와 결론이 무엇인지를 한 장에 담는다.
 * 둘을 따로 두면 상자가 쌓여 본문 첫 문장이 화면 아래로 밀린다.
 * 실측으로 제목에서 본문까지 데스크톱 952px, 모바일 1,380px이 나왔고
 * 그중 절반이 이 상자들과 그 사이 여백이었다.
 *
 * 한 장으로 묶어도 검색엔진과 AI가 읽는 내용은 그대로다. 테두리만 줄어든다.
 * 두 부분 모두 비어 있으면 카드 자체가 나오지 않는다.
 *
 * 숫자 칸을 따로 두었다가 뺐다. 숫자 하나만 남는 글이 대부분이었는데,
 * 세 칸짜리 격자에 하나만 들어가면 옆이 비어 오히려 눈에 걸렸다.
 * 기한이나 금액은 「핵심만 먼저」 문장 안에서 말하는 편이 읽힌다.
 */
export function PostBrief({
  reader,
  gain,
  points,
}: {
  reader?: string
  gain?: string
  points?: string[]
}) {
  const hasReader = !!(reader || gain)
  const hasPoints = !!(points && points.length > 0)
  if (!hasReader && !hasPoints) return null

  return (
    <aside className="brief" aria-label="글 요약">
      {hasReader && (
        <p className="brief-reader">
          {/* 누구를 위한 글인지와 읽고 나면 무엇을 할 수 있는지는 결국 한 이야기다.
              두 줄로 나누면 같은 말을 앞뒤로 두 번 한 것처럼 읽힌다. */}
          {reader && (
            <>
              <span aria-hidden="true">※</span> 이 글은 <b>{reader}</b>님을 위한 글입니다.{' '}
            </>
          )}
          {gain && <span className="brief-gain">{gain}</span>}
        </p>
      )}

      {hasPoints && (
        <div className="brief-points">
          <p className="brief-label">핵심만 먼저</p>
          <ul>
            {points!.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}
