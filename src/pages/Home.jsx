import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-50 px-6 sm:gap-12">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          my-photobooth
        </h1>
        <p className="mt-2 text-sm text-neutral-600 sm:mt-3 sm:text-base">
          나만의 포토부스에 오신 걸 환영해요
        </p>
      </header>

      <nav className="flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4">
        <Link
          to="/booth"
          className="rounded-2xl bg-neutral-900 px-8 py-4 text-center text-lg font-medium text-white shadow-lg transition hover:bg-neutral-800 sm:hover:scale-[1.02]"
        >
          포토부스 가기
        </Link>
        <Link
          to="/wall"
          className="rounded-2xl border border-neutral-300 bg-white px-8 py-4 text-center text-lg font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-100 sm:hover:scale-[1.02]"
        >
          벽 구경하기
        </Link>
      </nav>
    </div>
  )
}
