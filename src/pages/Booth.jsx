import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchColorChips } from '../api/basicFrames'
import { LeftArrow } from '../components/icons/Arrows'
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

const STEP_ORDER = ['welcome', 'frame', 'capture', 'edit', 'result']

export default function Booth() {
  const [step, setStep] = useState('welcome')
  const [selectedFrame, setSelectedFrame] = useState(null)
  const [photos, setPhotos] = useState([])
  const [editDraft, setEditDraft] = useState(null)
  const [editResult, setEditResult] = useState(null)
  const [colorChips, setColorChips] = useState([])

  useEffect(() => {
    let cancelled = false
    fetchColorChips()
      .then((items) => {
        if (!cancelled) setColorChips(items)
      })
      .catch((err) => {
        // 칩 로드 실패는 치명적 X — 기본 프레임은 프레임 자체 색으로 진행
        console.warn('failed to load color chips:', err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function handleStart() {
    setStep('frame')
  }

  function handleCaptureDone(blobs) {
    setPhotos(blobs)
    setEditDraft(null)
    setStep('edit')
  }

  function handleEditDone(result) {
    setEditResult(result)
    setStep('result')
  }

  function handleReset() {
    setSelectedFrame(null)
    setPhotos([])
    setEditDraft(null)
    setEditResult(null)
    setStep('welcome')
  }

  function handlePrevStep() {
    const currentIndex = STEP_ORDER.indexOf(step)
    if (currentIndex <= 0) return

    if (step === 'frame') {
      setSelectedFrame(null)
    }
    if (step === 'capture') {
      setPhotos([])
    }
    if (step === 'edit') {
      setEditDraft(null)
    }
    if (step === 'result') {
      setEditResult(null)
    }

    setStep(STEP_ORDER[currentIndex - 1])
  }

  function handleNextStep() {
    if (step === 'frame' && selectedFrame) {
      setStep('capture')
      return
    }

    if (step === 'edit' && editDraft?.canProceed) {
      handleEditDone({
        selectedIndices: editDraft.selectedIndices,
        filterId: editDraft.filterId,
        colorChipId: editDraft.colorChipId,
      })
    }
  }

  const showStepButtons = step !== 'welcome' && step !== 'result'
  const canGoPrev = step !== 'welcome'
  const canGoNext =
    (step === 'frame' && Boolean(selectedFrame)) ||
    (step === 'edit' && Boolean(editDraft?.canProceed))
  const prevButtonLabel = step === 'edit' ? 'retake' : 'previous'
  const prevButtonSrc =
    step === 'edit'
      ? '/booth/retake_picture_button.svg'
      : '/booth/prev_button.svg'
  const nextButtonLabel = step === 'edit' ? 'complete' : 'next'
  const nextButtonSrc =
    step === 'edit' ? '/booth/complete_button.svg' : '/booth/next_button.svg'

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-900 px-3 py-4 sm:h-dvh sm:px-6 sm:py-10">
      <div className="w-full max-w-6xl rounded-2xl bg-neutral-100 p-3 shadow-2xl ring-2 ring-neutral-800 sm:flex sm:h-full sm:flex-col sm:rounded-3xl sm:p-8 sm:ring-8 xl:max-w-360">
        <div className="flex shrink-0 items-center justify-between pb-3 sm:pb-4">
          <Link
            to="/"
            onClick={handleReset}
            className="flex items-center gap-1.5 font-handwriting text-base text-neutral-500 hover:text-neutral-900"
          >
            <LeftArrow className="h-3 w-auto" />
            나가기
          </Link>
          <span className="text-xs uppercase tracking-widest text-neutral-400">
            {STEP_LABEL[step]}
          </span>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col rounded-xl bg-white p-4 pb-20 sm:rounded-2xl sm:p-8 sm:pb-24">
          {step === 'welcome' && <WelcomeStep onStart={handleStart} />}
          {step === 'frame' && (
            <FrameSelectStep
              onSelectedChange={setSelectedFrame}
              colorChips={colorChips}
            />
          )}
          {step === 'capture' && (
            <CaptureStep frame={selectedFrame} onDone={handleCaptureDone} />
          )}
          {step === 'edit' && (
            <EditStep
              frame={selectedFrame}
              photos={photos}
              onDraftChange={setEditDraft}
              colorChips={colorChips}
            />
          )}
          {step === 'result' && (
            <ResultStep
              frame={selectedFrame}
              photos={photos}
              editResult={editResult}
              onReset={handleReset}
              colorChips={colorChips}
            />
          )}

          {showStepButtons && (
            <>
              <StepNavButton
                label={prevButtonLabel}
                src={prevButtonSrc}
                position="left"
                disabled={!canGoPrev}
                onClick={handlePrevStep}
              />
              <StepNavButton
                label={nextButtonLabel}
                src={nextButtonSrc}
                position="right"
                disabled={!canGoNext}
                onClick={handleNextStep}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StepNavButton({ label, src, position, disabled, onClick }) {
  const positionClass =
    position === 'left' ? 'left-4 sm:left-8' : 'right-4 sm:right-8'

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`absolute bottom-4 h-11 w-24 transition sm:bottom-6 sm:h-12 sm:w-28 ${positionClass} ${
        disabled
          ? 'cursor-not-allowed opacity-35 grayscale'
          : 'hover:-translate-y-0.5 hover:drop-shadow-md active:translate-y-0'
      }`}
    >
      <img src={src} alt="" className="h-full w-full object-contain" />
    </button>
  )
}
