/**
 * 한글 슬러그 생성기.
 * 구글 상위 사이트들이 쓰는 방식대로 한글을 그대로 URL에 남긴다.
 * 검색어와 URL이 일치하면 검색결과에서 굵게 표시되고 클릭률이 올라간다.
 */

export function toSlug(input: string): string {
  return (
    input
      .normalize('NFC')
      .trim()
      // 대괄호 안 분류표기 제거: [건설업] 등
      .replace(/^\s*\[[^\]]{1,30}\]\s*/g, '')
      .toLowerCase()
      // 한글·영문·숫자·공백·하이픈만 남긴다
      .replace(/[^가-힣a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      // URL이 지나치게 길어지면 잘라낸다
      .slice(0, 60)
      .replace(/-$/, '')
  )
}

/**
 * 분야 이름을 주소에 쓸 형태로 바꾼다.
 *
 * 이 파일에 두는 이유는 화면 쪽 컴포넌트가 쓰기 때문이다. 글 파일을 읽는
 * content.ts 에 두면 그 모듈이 node:fs 를 가져오고, 클라이언트 컴포넌트가
 * 이것 하나를 쓰려다 fs 까지 끌고 들어가 빌드가 깨진다.
 */
export function categorySlug(name: string): string {
  return name.trim().replace(/\s+/g, '-')
}

/** 목차 앵커용 ID. 중복이 생기면 뒤에 번호를 붙인다. */
export function toAnchorId(text: string, used: Set<string>): string {
  const base = toSlug(text) || 'section'
  let id = base
  let n = 2
  while (used.has(id)) {
    id = `${base}-${n}`
    n += 1
  }
  used.add(id)
  return id
}

/**
 * 이미지·파일 경로의 한글을 안전하게 인코딩한다.
 *
 * 한글이 그대로 든 경로에 미리 불러오기(preload)가 걸리면 Next가 이를 HTTP 헤더로
 * 내보내려다 실패한다. HTTP 헤더는 라틴-1 문자만 담을 수 있기 때문이다.
 */
export function encodePath(path: string): string {
  if (!path || /^https?:\/\//.test(path)) return path
  return path
    .split('/')
    .map((seg) => (seg ? encodeURIComponent(decodeURIComponent(seg)) : seg))
    .join('/')
}
