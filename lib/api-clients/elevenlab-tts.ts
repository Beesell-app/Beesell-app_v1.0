// @/lib/api-clients/elevenlab-tts.ts
const { audioBuffer } = await elevenLabsTTS({
  text: "Script text...",
  voice_id: "preset-voice-id", // Map from characterId
  stability: 0.5,
  similarity_boost: 0.75
})