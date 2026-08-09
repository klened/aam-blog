# aam-blog — 더블에이엠 3D프린팅 인사이트

이 저장소는 **더블에이엠(aamkorea.co.kr)의 블로그**다. 노무법인 도원 블로그(dowon-blog)를 포크해 만들어 코드는 같지만, **운영 주체·계정·콘텐츠가 완전히 별개다.** 두 블로그를 오가며 작업할 때 아래 표가 기준이다.

## 두 블로그 구분표

| 항목 | 이 저장소 (aam-blog) | 도원 (dowon-blog) — 여기서 다루지 않는다 |
|---|---|---|
| 회사 | (주)더블에이엠 — 3D프린터 공식 파트너 | 노무법인 도원 — 노무 컨설팅 |
| 주소 | blog.aamkorea.co.kr/blog | blog.dowonhr.com/blog |
| 로컬 폴더 | `Desktop\aam-blog` | `Desktop\dowon-blog` |
| GitHub | **klened/aam-blog** (푸시는 choim-gif 협업자 권한) | choim-gif/dowon-blog |
| Cloudflare | **Kleneed7@gmail.com 계정** · 프로젝트 aam-blog | choim@dowonhr.com 계정 · 프로젝트 dowon-blog |
| 서치콘솔 | choim@dowonhr.com에 속성 등록 (2026-08) | choim@dowonhr.com |
| DNS 관리 | 더블에이엠 아임웹 관리자 → 설정 → 도메인·SSL | 도원 아임웹 관리자 |
| 글 주제 | 3D프린팅 (장비 선택·소재·후처리·활용 사례) | 인사·노무 (4대보험·산재·해고 등) |
| 작성자 | '더블에이엠 기술팀' 단일 명의 | 노무사 실명 자동 배정 |
| 채팅 위젯 | 없음 — 문의 버튼은 aamkorea.co.kr/request 링크 | 채널톡 사용 |

## 이 저장소에서 반드시 지킬 것

1. **주제 검문**: 글을 쓰거나 옮기기 전에 주제가 3D프린팅인지 확인한다. 노무·인사 원고가 오면 이 저장소가 아니라 dowon-blog 건이다. 반대도 같다.
2. **설정 값 교차 복사 금지**: `src/config/site.ts`의 VERIFY·ANALYTICS·CHANNEL에 도원 값(GA `G-L3DBRV5DJJ`, 도원 채널톡 키, 도원 서치콘솔 확인 값)을 절대 넣지 않는다. 이 저장소의 분석 값은 별도로 발급받아 채운다.
3. **배포 확인**: push 하면 Cloudflare **Kleneed7 계정**의 aam-blog 프로젝트가 자동 배포한다. 대시보드를 볼 일이 있으면 웨일 브라우저(kleneed7 세션)를 쓴다. 도원 대시보드는 크롬(choim 세션)이다.
4. **DNS 주의**: aamkorea.co.kr 존에는 아웃룩 메일(MX·SPF)과 스티비 DKIM이 있다. 레코드를 만질 때 기존 행을 절대 수정·삭제하지 않는다. 루트 도메인은 아임웹 홈페이지다.
5. **문장 규칙**: 도원 자체 블로그와 같은 기준을 쓴다 — 본문 합쇼체, 한 문장 45자 이내, 번역체·은유 명사·등치 구문 금지, 수치는 확인된 것만. 기준 문서는 `docs/글-표준구조.md`.
6. **발행 절차**: `content/_템플릿.md` 복사 → `content/posts/`에 작성 → `npm run seo:check` → `상태: 발행` → push.
