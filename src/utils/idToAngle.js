// 문자열 id를 결정적으로 -range..+range 각도로 변환.
// 벽 사진·테이프·스켈레톤이 매 렌더마다 같은(안 흔들리는) 기울기를 갖게 한다.
export function idToAngle(id, range) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  // JS의 %는 음수에서 음수를 반환해서 한쪽으로 편향됨 → unsigned로 변환
  const unsigned = hash >>> 0
  const normalized = ((unsigned % 1000) / 1000 - 0.5) * 2 // -1..+1
  return normalized * range
}
