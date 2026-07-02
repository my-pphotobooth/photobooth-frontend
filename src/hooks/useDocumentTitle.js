import { useEffect } from 'react'

export const BRAND = '갱스포토'

// 페이지별 문서 타이틀을 세팅한다.
// page 없으면 브랜드만("갱스포토"), 있으면 "<page> | 갱스포토".
export function useDocumentTitle(page) {
  useEffect(() => {
    const title = page ? `${page} | ${BRAND}` : BRAND
    document.title = title
    return () => {
      // 다른 페이지로 이동 시 다음 페이지가 다시 세팅하지만,
      // 세팅 안 하는 경로 대비해 브랜드 기본값으로 되돌림
      document.title = BRAND
    }
  }, [page])
}
