import { idToAngle } from '../../utils/idToAngle'

// 벽 로딩 중 실제 사진 배치(폴라로이드 + 테이프, 살짝 기울어짐)를 흉내 내는 스켈레톤.
// WallPhoto와 같은 각도 로직·크기를 써서 로드 완료 시 전환이 자연스럽다.
export default function WallSkeleton({ count = 6 }) {
  return (
    <div className="flex flex-wrap items-start justify-center gap-8 sm:gap-12">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPhoto key={i} index={i} />
      ))}
    </div>
  )
}

function SkeletonPhoto({ index }) {
  const angle = idToAngle('skeleton-' + index, 1.5)
  const tapeAngle = idToAngle('skeleton-' + index + 'tape', 4)
  // 세로/가로를 번갈아 배치해 실제 벽의 섞인 느낌을 낸다.
  const aspectClass = index % 2 === 0 ? 'aspect-4/3' : 'aspect-3/4'

  return (
    <div className="relative" style={{ transform: `rotate(${angle}deg)` }}>
      <div
        className="pointer-events-none absolute left-1/2 top-0 z-10 h-6 w-20 animate-pulse rounded-sm bg-gray-300/70 sm:w-24 lg:w-28"
        style={{ transform: `translate(-50%, -50%) rotate(${tapeAngle}deg)` }}
      />
      <div
        className={`h-72 animate-pulse rounded-sm bg-neutral-200 shadow-[0_6px_20px_rgba(0,0,0,0.15)] sm:h-96 lg:h-112 ${aspectClass}`}
      />
    </div>
  )
}
