import { Agent, Box } from "@upstash/box"

const box = await Box.create({
  runtime: "node",
  agent: {
    harness: Agent.Codex,
    model: "openai/gpt-5.3-codex",
    apiKey: process.env.OPENAI_API_KEY,
  },
})