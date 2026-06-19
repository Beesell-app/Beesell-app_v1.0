// @/lib/api-clients/r2-upload.ts
const audioUrl = await uploadToR2({
  buffer: audioBuffer,
  filename: `audio-${Date.now()}.wav`,
  bucket: 'beesell-ugc'
})