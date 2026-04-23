const MOCK_DELAY = 600

export async function uploadPhoto(blob) {
  console.log('[mock] uploadPhoto', `${(blob.size / 1024).toFixed(1)} KB`)
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY))
  return {
    id: `mock-${Date.now()}`,
    url: URL.createObjectURL(blob),
    createdAt: new Date().toISOString(),
  }
}

export async function fetchPhotos() {
  console.log('[mock] fetchPhotos')
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY))
  return []
}
