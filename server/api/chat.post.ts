import type { UIMessage } from 'ai'
import { createGoogle } from '@ai-sdk/google'
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  validateUIMessages,
} from 'ai'

// The system prompt: how the assistant behaves in every conversation.
const INSTRUCTIONS = `You are a friendly assistant in a demo app about generative UI.
Answer briefly and use Markdown when it helps.`

// A lazy handler runs the outer function once, on the first request,
// so the Gemini provider is created once and reused by every request.
export default defineLazyEventHandler(() => {
  const { googleApiKey, aiModel } = useRuntimeConfig()
  if (!googleApiKey)
    throw new Error('Missing NUXT_GOOGLE_API_KEY. Copy .env.example to .env and add your key.')

  const google = createGoogle({ apiKey: googleApiKey })

  return defineEventHandler(async (event) => {
    // The browser sends the whole conversation on every request: the model has no memory.
    const body = await readBody(event)

    // Never trust the request body: check it has the shape of chat messages.
    let messages: UIMessage[]
    try {
      messages = await validateUIMessages({ messages: body?.messages })
    }
    catch {
      throw createError({ statusCode: 400, statusMessage: 'Invalid chat messages' })
    }

    const result = streamText({
      model: google(aiModel),
      instructions: INSTRUCTIONS,
      // UI messages (what the page shows) -> model messages (what the LLM reads).
      messages: await convertToModelMessages(messages),
    })

    // Stream the reply back as "UI message parts", the format useChat understands.
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        // By default errors are hidden from the browser. For learning, we show the real
        // message (e.g. a 429 when the free-tier quota runs out).
        onError: error => error instanceof Error
          ? error.message
          : 'Unknown error',
      }),
    })
  })
})
