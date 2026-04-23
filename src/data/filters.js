export const filters = [
  { id: 'original', name: '원본', css: 'none' },
  { id: 'bright', name: '밝게', css: 'brightness(1.15) saturate(1.1)' },
  { id: 'grayscale', name: '흑백', css: 'grayscale(1)' },
  { id: 'vintage', name: '빈티지', css: 'sepia(0.4) contrast(0.95)' },
  { id: 'film', name: '필름', css: 'sepia(0.2) saturate(1.2) hue-rotate(-10deg)' },
]

export const DEFAULT_FILTER_ID = 'original'

export function getFilterById(id) {
  return filters.find((f) => f.id === id) ?? filters[0]
}
