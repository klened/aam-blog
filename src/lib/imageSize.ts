import fs from 'node:fs'
import path from 'node:path'

/**
 * 이미지의 실제 크기를 읽는다.
 *
 * `<img>` 에 width·height 를 적어 두면 브라우저가 그림이 도착하기 전에 자리를
 * 잡아 둔다. 없으면 그림이 뜨는 순간 아래 글자가 밀리고, 구글은 그 밀림을
 * 점수로 센다(CLS). 정적 사이트라 빌드할 때 파일에서 읽어 넣으면 된다.
 *
 * 라이브러리를 쓰지 않고 파일 앞부분만 뜯어 읽는다. 크기를 알자고 이미지
 * 처리 패키지를 통째로 들이는 것은 과하고, 빌드 환경마다 설치가 달라진다.
 *
 * 못 읽으면 null 이다. 그때는 width·height 없이 나가고 예전과 같아진다.
 */

type 크기 = { w: number; h: number }
const 기억 = new Map<string, 크기 | null>()

function 파일경로(웹경로: string): string {
  const clean = decodeURIComponent(웹경로.split('?')[0]).replace(/^\//, '')
  return path.join(process.cwd(), 'public', clean)
}

/** WebP. RIFF 컨테이너 안에 VP8 / VP8L / VP8X 세 가지가 올 수 있다. */
function webp(b: Buffer): 크기 | null {
  if (b.length < 30 || b.toString('ascii', 0, 4) !== 'RIFF') return null
  if (b.toString('ascii', 8, 12) !== 'WEBP') return null
  const kind = b.toString('ascii', 12, 16)

  if (kind === 'VP8X') {
    const w = (b[24] | (b[25] << 8) | (b[26] << 16)) + 1
    const h = (b[27] | (b[28] << 8) | (b[29] << 16)) + 1
    return { w, h }
  }
  if (kind === 'VP8 ') {
    // 프레임 태그 뒤 3바이트 싱크 코드(0x9d 0x01 0x2a)를 지나면 크기가 온다.
    if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null
    return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff }
  }
  if (kind === 'VP8L') {
    if (b[20] !== 0x2f) return null
    const bits = b.readUInt32LE(21)
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 }
  }
  return null
}

function png(b: Buffer): 크기 | null {
  if (b.length < 24 || b.toString('ascii', 1, 4) !== 'PNG') return null
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
}

function jpeg(b: Buffer): 크기 | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null
  let i = 2
  while (i < b.length - 9) {
    if (b[i] !== 0xff) {
      i += 1
      continue
    }
    const marker = b[i + 1]
    // SOF0~SOF15 중 크기를 담은 것들. DHT(c4)·JPG(c8)·DAC(cc)는 아니다.
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) }
    }
    i += 2 + b.readUInt16BE(i + 2)
  }
  return null
}

/** `/images/foo/1.webp` 처럼 화면에서 쓰는 경로를 그대로 넘긴다. */
export function imageSize(웹경로: string): 크기 | null {
  if (!웹경로 || /^https?:/.test(웹경로)) return null
  if (기억.has(웹경로)) return 기억.get(웹경로) ?? null

  let 결과: 크기 | null = null
  try {
    const fd = fs.openSync(파일경로(웹경로), 'r')
    const buf = Buffer.alloc(64 * 1024)
    const read = fs.readSync(fd, buf, 0, buf.length, 0)
    fs.closeSync(fd)
    const head = buf.subarray(0, read)
    결과 = webp(head) ?? png(head) ?? jpeg(head)
  } catch {
    결과 = null
  }
  기억.set(웹경로, 결과)
  return 결과
}

/**
 * 그림 주소 뒤에 붙일 표식을 만든다.
 *
 * 그림에는 30일짜리 캐시가 걸려 있다. 폴더에서 그림을 바꿔 끼워도 주소가
 * 그대로면 이미 한 번 본 사람의 브라우저는 30일 동안 새 파일을 받지 않는다.
 * 실제로 그림을 갈아 끼웠는데 화면이 그대로인 일이 있었다.
 *
 * 그래서 파일이 바뀌면 주소도 바뀌게 한다. 파일의 크기와 고친 시각으로
 * 짧은 표식을 만들어 `?v=` 로 붙인다. 내용이 그대로면 표식도 그대로라
 * 캐시는 계속 쓰인다.
 *
 * 내용을 통째로 읽어 해시를 뜨지 않는 이유는 빌드가 느려지기 때문이다.
 * 크기와 시각이 둘 다 같은데 내용만 다른 경우는 실질적으로 없다.
 */
const 표식기억 = new Map<string, string>()

function 표식(웹경로: string): string {
  if (표식기억.has(웹경로)) return 표식기억.get(웹경로)!
  let v = ''
  try {
    const st = fs.statSync(파일경로(웹경로))
    v = (Math.round(st.mtimeMs) ^ st.size).toString(36).slice(-6)
  } catch {
    v = ''
  }
  표식기억.set(웹경로, v)
  return v
}

/**
 * 화면에 넣을 그림 주소. 한글을 인코딩하고 캐시 표식을 붙인다.
 *
 * `<img src>` 와 `srcset` 이 같은 주소를 써야 브라우저가 한 파일로 본다.
 * 그래서 주소를 만드는 곳을 여기 하나로 모아 둔다.
 */
export function imageSrc(웹경로: string): string {
  if (!웹경로 || /^https?:/.test(웹경로)) return 웹경로
  const v = 표식(웹경로)
  return v ? `${encodeURI(웹경로)}?v=${v}` : encodeURI(웹경로)
}

/**
 * 좁은 화면용으로 미리 줄여 둔 그림이 있으면 srcset 을 만들어 준다.
 *
 * 원본이 966px인데 휴대폰의 343px 자리에 그대로 보내면 그만큼이 낭비된다.
 * 줄인 파일은 `이름@480.webp` 로 옆에 둔다. 없으면 빈 값이라 원본만 나간다.
 * 만드는 것은 scripts/make-image-variants.py 가 한다.
 */
export function srcSet(웹경로: string): { srcSet?: string; sizes?: string } {
  const 원본 = imageSize(웹경로)
  if (!원본 || 원본.w <= 700) return {}

  const 작은것 = 웹경로.replace(/\.(webp|png|jpe?g)$/i, '@480.$1')
  const 작은크기 = imageSize(작은것)
  if (!작은크기) return {}

  return {
    srcSet: `${imageSrc(작은것)} ${작은크기.w}w, ${imageSrc(웹경로)} ${원본.w}w`,
    // 본문 칸이 760px, 좁은 화면에서는 화면 폭을 거의 다 쓴다.
    sizes: '(max-width: 800px) 100vw, 760px',
  }
}
