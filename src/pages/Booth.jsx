import { useState } from 'react'
import { Link } from 'react-router-dom'
import WelcomeStep from '../components/booth/WelcomeStep'
import FrameSelectStep from '../components/booth/FrameSelectStep'
import CaptureStep from '../components/booth/CaptureStep'
import EditStep from '../components/booth/EditStep'
import ResultStep from '../components/booth/ResultStep'

const STEP_LABEL = {
  welcome: '시작',
  frame: '프레임 선택',
  capture: '촬영',
  edit: '편집',
  result: '완료',
}

export default function Booth() {
  const [step, setStep] = useState('welcome')
  const [selectedFrame, setSelectedFrame] = useState(null)
  const [photos, setPhotos] = useState([])
  const [editResult, setEditResult] = useState(null)

  function handleStart() {
    setStep('frame')
  }

  function handleFrameSelected(frame) {
    setSelectedFrame(frame)
    setStep('capture')
  }

  function handleCaptureDone(blobs) {
    setPhotos(blobs)
    setStep('edit')
  }

  function handleEditDone(result) {
    setEditResult(result)
    setStep('result')
  }

  function handleReset() {
    setSelectedFrame(null)
    setPhotos([])
    setEditResult(null)
    setStep('welcome')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-900 px-3 py-4 sm:h-dvh sm:px-6 sm:py-10">
      <div className="w-full max-w-6xl rounded-2xl bg-neutral-100 p-3 shadow-2xl ring-2 ring-neutral-800 sm:flex sm:h-full sm:flex-col sm:rounded-3xl sm:p-8 sm:ring-8 xl:max-w-360">
        <div className="flex shrink-0 items-center justify-between pb-3 sm:pb-4">
          <Link
            to="/"
            onClick={handleReset}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            ← 나가기
          </Link>
          <span className="text-xs uppercase tracking-widest text-neutral-400">
            {STEP_LABEL[step]}
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-xl bg-white p-4 sm:rounded-2xl sm:p-8">
          {step === 'welcome' && <WelcomeStep onStart={handleStart} />}
          {step === 'frame' && <FrameSelectStep onSelect={handleFrameSelected} />}
          {step === 'capture' && (
            <CaptureStep frame={selectedFrame} onDone={handleCaptureDone} />
          )}
          {step === 'edit' && (
            <EditStep
              frame={selectedFrame}
              photos={photos}
              onDone={handleEditDone}
            />
          )}
          {step === 'result' && (
            <ResultStep
              frame={selectedFrame}
              photos={photos}
              editResult={editResult}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  )
}
