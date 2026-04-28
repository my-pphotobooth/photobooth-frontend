import { Link } from 'react-router-dom'
import { useCamera } from '../../hooks/useCamera'

// 손그림 SVG (3602×3159) 위에 % 좌표로 인터랙션 영역 오버레이.
// SVG에 간판 글자·NOTICE·FRAME·거울 사선 등 모든 디테일이 그려져 있음.
const AREAS = {
  curtain: { left: 24, top: 18, width: 46, height: 63 },
  mirror: { left: 72, top: 34.3, width: 25, height: 51 },
}

export default function BoothIllustration({ mirrorOn, onMirrorToggle }) {
  return (
    <div className="relative w-full max-w-3xl">
      <div className="relative aspect-3602/3159 w-full">
        {/* 부스 손그림 */}
        <img
          src="/home/photo_booth.svg"
          alt=""
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        />

        {/* 커튼 클릭 영역 → /booth */}
        <Link
          to="/booth"
          className="absolute rounded-md transition hover:bg-amber-200/20"
          style={areaStyle(AREAS.curtain)}
          aria-label="포토부스 시작"
        />

        {/* 거울 클릭 영역 → 카메라 토글 */}
        <button
          onClick={onMirrorToggle}
          className="absolute transition"
          style={areaStyle(AREAS.mirror)}
          aria-label={mirrorOn ? '거울 닫기' : '거울 (셀카 미리보기)'}
        >
          {mirrorOn && <MirrorCamera />}
        </button>
      </div>
    </div>
  )
}

function areaStyle({ left, top, width, height }) {
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
  }
}

const MIRROR_PATH =
  'M98.6384 22.6369C95.6106 28.2164 85.7502 54.3242 71.2941 96.9587C59.9091 130.536 56.7638 152.111 52.6236 170.31C49.7103 183.116 43.1984 202.45 37.8831 235.251C32.5678 268.053 28.1481 313.552 25.9002 345.809C23.6524 378.066 23.7104 395.702 20.1232 462.816C16.5361 529.929 9.30203 645.984 6.47574 748.002C3.64946 850.021 5.45011 934.486 7.16671 986.35C8.88331 1038.21 10.4613 1054.92 13.2116 1073.73C18.9753 1113.14 23.8532 1141.4 25.4422 1161.46C26.4497 1174.18 30.1109 1191.73 38.2669 1226.31C46.4229 1260.9 59.5367 1311.91 67.4438 1340.97C76.9452 1375.89 90.7367 1396.14 111.549 1423.21C141.18 1461.76 163.303 1470.05 195.247 1485.9C206.691 1491.58 214.98 1493.36 234.093 1502.16C277.809 1522.28 316.591 1529.6 330.81 1534.23C337.353 1536.37 342.739 1537.02 377.852 1537.38C412.965 1537.75 477.695 1537.53 518.651 1536.01C574.92 1533.91 602.682 1524.04 622.64 1516.02C639.971 1509.05 650.38 1502.31 662.269 1493.37C677.593 1481.85 686.404 1467.54 704.374 1447.82C744.191 1404.12 759.268 1393.21 777.214 1366.48C791.374 1345.4 801.307 1320.95 816.213 1292.29C840.035 1246.49 850.211 1202.59 854.371 1187.09C856.713 1178.37 862.253 1138.14 870.908 1082.34C876.452 1046.6 880.339 1016.95 882.212 993.389C882.96 983.979 884.698 931.906 885.989 857.852C886.455 831.134 887.421 826.498 887.696 790.689C887.97 754.88 887.751 688.047 887.251 651.762C886.699 611.744 885.125 591.236 884.269 562.674C883.087 523.179 875.537 482.465 871.607 452.451C868.921 431.932 865.303 401.938 863.274 377.895C861.791 360.323 855.856 336.26 841.845 279.191C836.559 257.657 822.508 230.493 808.531 211.622C800.846 201.247 793.074 191.997 780.352 176.104C769.45 162.482 759.12 154.585 747.158 141.516C732.319 125.305 719.751 112.521 702.814 99.0042C681.168 81.7292 668.837 68.6383 641.558 50.4724C620.657 36.5535 591.89 23.8851 560.002 14.623C532.337 6.58761 508.689 7.22495 491.784 6.81638C484.771 6.64689 480.968 5.45955 434.455 5.13421C387.942 4.80887 298.843 5.10168 250.279 5.7254C196.375 6.41771 176.43 8.31684 152.224 8.86051C123.326 14.089 95.6475 25.4033 76.4424 34.3974C71.8002 36.7614 68.0016 39.5586 64.0973 45.2535'

function MirrorCamera() {
  const { videoRef, status } = useCamera({ width: 480, height: 640 })
  return (
    <svg
      viewBox="0 0 893 1543"
      preserveAspectRatio="xMidYMid meet"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <clipPath id="mirror-clip">
          <path d={MIRROR_PATH} />
        </clipPath>
      </defs>
      <foreignObject
        x="0"
        y="0"
        width="893"
        height="1543"
        clipPath="url(#mirror-clip)"
      >
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
          }}
        />
        {status !== 'ready' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              background: 'rgba(0,0,0,0.5)',
            }}
          >
            {status === 'requesting' && '카메라 준비 중…'}
            {status === 'error' && '카메라 사용 불가'}
          </div>
        )}
      </foreignObject>
    </svg>
  )
}
