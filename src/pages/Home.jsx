import { useState } from 'react'
import BoothIllustration from '../components/home/BoothIllustration'
import MorePhotosLink from '../components/home/MorePhotosLink'

export default function Home() {
  const [mirrorOn, setMirrorOn] = useState(false)

  return (
    <div className="min-h-dvh bg-amber-50 px-4 py-8 sm:py-12 lg:py-16">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-16">
        <BoothIllustration
          mirrorOn={mirrorOn}
          onMirrorToggle={() => setMirrorOn((v) => !v)}
        />
        <MorePhotosLink />
      </div>
    </div>
  )
}
