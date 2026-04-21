import { useState } from 'react'
import { Link } from 'react-router-dom'

const STEPS = ['welcome', 'frame', 'capture', 'edit', 'result']

export default function Booth() {
  const [step, setStep] = useState('welcome')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-900 px-6 py-10">
      <div className="w-full max-w-4xl rounded-3xl bg-neutral-100 p-8 shadow-2xl ring-8 ring-neutral-800">
        <div className="flex items-center justify-between pb-4">
          <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-900">
            ← 나가기
          </Link>
          <span className="text-xs uppercase tracking-widest text-neutral-400">
            {step}
          </span>
        </div>

        <div className="min-h-[480px] rounded-2xl bg-white p-8">
          {step === 'welcome' && (
            <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
              <h2 className="text-3xl font-bold">어서 오세요</h2>
              <p className="text-neutral-600">8장을 찍고 마음에 드는 4장을 골라보세요</p>
              <button
                onClick={() => setStep('frame')}
                className="rounded-xl bg-neutral-900 px-8 py-3 text-white hover:bg-neutral-800"
              >
                시작하기
              </button>
            </div>
          )}
          {step !== 'welcome' && (
            <div className="flex h-full items-center justify-center text-neutral-400">
              {step} 단계 (구현 예정)
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
