// 목록의 "마지막 정렬 순서 + 1" — 새 항목의 기본 정렬 순서로 쓴다.
// 비어있으면 0.
export function nextSortOrder(items) {
  if (!Array.isArray(items) || items.length === 0) return 0
  return Math.max(...items.map((i) => i.sortOrder ?? 0)) + 1
}
