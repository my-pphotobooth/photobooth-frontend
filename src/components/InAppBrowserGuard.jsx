import { useMemo, useState } from 'react'

const SAFE_ENTRY_URL = 'https://photobooth.gangmin2.com/'

function isInstagramInApp() {
  return /Instagram/i.test(navigator.userAgent)
}

function isAndroid() {
  return /Android/i.test(navigator.userAgent)
}

function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function buildChromeIntent(url) {
  const u = new URL(url)
  return `intent://${u.host}${u.pathname}${u.search}${u.hash}#Intent;scheme=${u.protocol.replace(':', '')};package=com.android.chrome;end`
}

function buildIOSChromeUrl(url) {
  return url.replace(/^https?:\/\//, (scheme) =>
    scheme === 'https://' ? 'googlechromes://' : 'googlechrome://',
  )
}

export default function InAppBrowserGuard({ children }) {
  const [copied, setCopied] = useState(false)
  const currentUrl = useMemo(() => SAFE_ENTRY_URL, [])
  const blocked = isInstagramInApp()
  const android = isAndroid()
  const ios = isIOS()

  if (!blocked) return children

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  function openChrome() {
    window.location.href = android
      ? buildChromeIntent(currentUrl)
      : buildIOSChromeUrl(currentUrl)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-5 py-8 text-neutral-900">
      <div className="w-full max-w-sm text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Gangmin Photo
        </p>
        <h1 className="mt-4 text-2xl font-bold leading-tight text-neutral-950">
          외부 브라우저에서 열어주세요
        </h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          인스타그램 인앱브라우저에서는 카메라와 프레임 이미지가 불안정할 수
          있어요. Safari나 Chrome에서 열면 더 안정적으로 촬영할 수 있습니다.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={openChrome}
            className="rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-neutral-200 transition hover:bg-neutral-800"
          >
            Chrome에서 열기
          </button>
          <button
            type="button"
            onClick={copyUrl}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-100"
          >
            {copied ? '링크를 복사했어요' : '링크 복사하기'}
          </button>
        </div>

        {ios && (
          <p className="mt-5 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-xs leading-5 text-neutral-500 shadow-sm">
            Safari로 열려면 오른쪽 위 메뉴를 누른 뒤 Safari에서 열기를 선택해
            주세요.
          </p>
        )}
        {android && (
          <p className="mt-5 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-xs leading-5 text-neutral-500 shadow-sm">
            버튼이 동작하지 않으면 메뉴에서 Chrome으로 열기를 선택하거나 링크를
            복사해 Chrome 주소창에 붙여넣어 주세요.
          </p>
        )}
      </div>
    </div>
  )
}
