// 기본 규격(basic_layout)을 부스에서 쓰는 frame 객체로 변환한다.
// 색은 편집 단계에서 컬러칩으로 입힌다(withChip).
export function basicFrameBase(basicLayout) {
  return {
    id: `basic:${basicLayout.id}`,
    name: basicLayout.name,
    isBasic: true,
    basicLayoutId: basicLayout.id,
    layout: basicLayout.layout,
    footerText: basicLayout.footerText,
    frameImageUrl: null,
    overlays: null,
    // 색은 withChip으로 채워짐 (썸네일/초기값은 대표 칩)
    backgroundColor: '#ffffff',
    slotColor: '#e5e7eb',
    textColor: '#1f2937',
  }
}

// frame에 컬러칩 색을 입힌 새 frame을 반환.
export function withChip(frame, chip) {
  if (!chip) return frame
  return {
    ...frame,
    backgroundColor: chip.backgroundColor,
    slotColor: chip.slotColor,
    textColor: chip.textColor,
  }
}
