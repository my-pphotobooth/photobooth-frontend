export default function WelcomeStep({ onStart }) {
  return (
    <div className="flex h-full min-h-100 flex-col items-center justify-center gap-4 text-center sm:min-h-120 sm:gap-6">
      <div className="text-5xl sm:text-6xl">📸</div>
      <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">어서 오세요</h2>
      <p className="max-w-md px-4 text-sm text-neutral-600 sm:text-base">
        프레임을 고르고 8장을 촬영한 뒤, 마음에 드는 4장을 골라보세요.
      </p>
      <button
        onClick={onStart}
        className="mt-2 rounded-xl bg-neutral-900 px-10 py-4 text-base text-white shadow-lg transition hover:bg-neutral-800 sm:mt-4 sm:text-lg sm:hover:scale-[1.02]"
      >
        시작하기
      </button>
    </div>
  )
}
