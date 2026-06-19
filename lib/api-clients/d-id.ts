// @/lib/api-clients/d-id.ts

export {}

async function didTalksHD({
  source_url,
  audio_url,
}: {
  source_url: string
  audio_url: string
}) {
  const apiKey = process.env.D_ID_API_KEY
  if (!apiKey) {
    throw new Error("Missing D_ID_API_KEY environment variable")
  }

  const response = await fetch("https://api.d-id.com/talks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ source_url, audio_url }),
  })

  if (!response.ok) {
    throw new Error(`D-ID request failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

const { talk_id, status_url } = await didTalksHD({
  source_url: "https://avatar-cdn/avatar.jpg",
  audio_url: "https://r2-cdn/audio.wav"
})