const KLING_API_KEY = process.env.KLING_API_KEY!
const KLING_API_SECRET = process.env.KLING_API_SECRET!
const KLING_BASE_URL = process.env.KLING_BASE_URL!

export async function generateKlingVideo(prompt: string) {
  const response = await fetch(`${KLING_BASE_URL}/v1/videos/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KLING_API_KEY}`,
      'X-API-SECRET': KLING_API_SECRET,
    },
    body: JSON.stringify({
      prompt,
      duration: 5,
      aspect_ratio: '9:16',
    }),
  })

  if (!response.ok) {
    throw new Error('Kling API Error')
  }

  return response.json()
}