import { imageSize, imageSrc, srcSet } from './imageSize'

/**
 * `<img>` 에 붙일 것을 한 번에 만들어 준다. 주소, 크기, 화면별 그림이다.
 *
 *   <img {...imageAttrs(경로)} alt="" />
 *
 * **`src` 를 따로 적지 마십시오.** 주소에는 캐시 표식이 붙는데, `src` 만
 * 손으로 적으면 그 표식이 빠져 그림을 바꿔도 예전 것이 계속 보인다.
 *
 * 크기를 알아내지 못해도 주소는 돌려준다. 그때는 width·height 없이 나가고
 * 붙이기 전과 같아진다. 화면별 그림은 원본이 700px을 넘고 줄인 파일이
 * 있을 때만 붙는다.
 */
export function imageAttrs(웹경로: string): {
  src: string
  width?: number
  height?: number
  srcSet?: string
  sizes?: string
} {
  const src = imageSrc(웹경로)
  const 크기 = imageSize(웹경로)
  if (!크기) return { src }
  return { src, width: 크기.w, height: 크기.h, ...srcSet(웹경로) }
}
