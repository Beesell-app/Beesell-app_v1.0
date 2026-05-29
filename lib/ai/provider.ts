import { createOpenAI } from '@ai-sdk/openai'

export const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})