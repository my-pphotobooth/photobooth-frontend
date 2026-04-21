import { Link } from 'react-router-dom'

export default function Wall() {
  return (
    <div className="min-h-screen bg-amber-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex items-center justify-between">
          <Link to="/" className="text-sm text-neutral-600 hover:text-neutral-900">
            ← 홈으로
          </Link>
          <h1 className="text-2xl font-bold text-neutral-900">벽</h1>
          <div className="w-16" />
        </header>

        <div className="rounded-lg bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%224%22 height=%224%22><rect width=%224%22 height=%224%22 fill=%22%23f5efe0%22/></svg>')] p-10 text-center text-neutral-500">
          (사진이 여기에 붙을 예정)
        </div>
      </div>
    </div>
  )
}
