/**
 * 글쓴이 명부.
 *
 * 3D프린팅 장비·소재 글은 사양과 가격이 걸려 있어, 누가 쓰는지가 신뢰를 만든다.
 * 지금은 기술팀 명의 하나로 시작하고, 실무 엔지니어가 실명으로 참여하게 되면
 * 여기에 사람을 추가한다. 사람을 추가하면 site.ts 의 CATEGORY_OWNERS 도 함께
 * 나눠 준다.
 *
 * 사진은 배경을 지운 이미지를 public/images/팀/{이름}.webp 에 두면 붙는다.
 * 없으면 이름 첫 글자 배지로 대체되므로, 사진 없이도 페이지는 정상 동작한다.
 */

export type Member = {
  /** 직책. 비워 두면 화면에는 이름만 나온다. */
  title: string
  /** 소속 팀. 적으면 '팀 이름 직책' 순서로 표기한다. */
  team?: string
  photo?: string
  /** 학력. 한 줄. */
  school?: string
  /** 주요 경력. 現/前 을 앞에 붙여 적는다. */
  career?: string[]
  /** 위원·강사 등 대외 활동. */
  activities?: string[]
  /** 실제로 수행한 일. 이 사람이 무엇을 하는 사람인지 가장 잘 보여준다. */
  work?: string[]
}

export const MEMBERS: Record<string, Member> = {
  '더블에이엠 기술팀': {
    title: '',
    career: [
      '스트라타시스(Stratasys) 공식 파트너',
      '폼랩(Formlabs) 공식 파트너',
      '얼티메이커(UltiMaker) 공식 파트너',
    ],
    work: [
      '산업용 3D프린터 도입 컨설팅 및 판매',
      '시제품·치공구 제작 서비스',
      '소재 선정과 출력 공정 설계',
      '장비 유지보수·AS와 사용자 교육',
    ],
  },
}

export function member(name: string): Member {
  return MEMBERS[name] ?? { title: '' }
}

/**
 * 동그란 얼굴 사진.
 *
 * 반신 사진을 그대로 동그랗게 자르면 얼굴이 위로 치우친다. 그래서 얼굴만
 * 따로 잘라 `얼굴/` 폴더 아래에 같은 이름으로 둔다. 얼굴 사진이 없으면
 * 이름 첫 글자 배지가 대신 나온다.
 */
export function memberAvatar(name: string): string | undefined {
  const m = MEMBERS[name]
  return m?.photo ? m.photo.replace('/팀/', '/팀/얼굴/') : undefined
}

/**
 * 화면에 쓰는 이름표.
 *
 * 팀이 적힌 사람은 '기술지원팀 홍길동 팀장'처럼 팀을 앞에, 직책을 뒤에 둔다.
 * 직책이 비어 있으면 이름만 쓴다. 지금의 팀 명의 글쓴이가 그 경우다.
 */
export function memberLabel(name: string): string {
  const m = member(name)
  if (m.team) return `${m.team} ${name} ${m.title}`.trim()
  return `${m.title} ${name}`.trim()
}
