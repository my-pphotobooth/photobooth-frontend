import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12 bg-neutral-50 px-6">
      <header className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-neutral-900">
          my-photobooth
        </h1>
        <p className="mt-3 text-neutral-600">나만의 포토부스에 오신 걸 환영해요</p>
      </header>

      <nav className="flex flex-col gap-4 sm:flex-row">
        <Link
          to="/booth"
          className="rounded-2xl bg-neutral-900 px-8 py-4 text-lg font-medium text-white shadow-lg transition hover:scale-[1.02] hover:bg-neutral-800"
        >
          포토부스 가기
        </Link>
        <Link
          to="/wall"
          className="rounded-2xl border border-neutral-300 bg-white px-8 py-4 text-lg font-medium text-neutral-900 shadow-sm transition hover:scale-[1.02] hover:bg-neutral-100"
        >
          벽 구경하기
        </Link>
      </nav>
    </div>
  )
}
