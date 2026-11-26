import type { GenUIMessage } from '#shared/genui'
import { createGoogle } from '@ai-sdk/google'
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  validateUIMessages,
} from 'ai'

// The system prompt: how the assistant behaves in every conversation.
const INSTRUCTIONS = `You are a friendly assistant in a demo app about generative UI.
Answer briefly and use Markdown when it helps.

You can show visual components by calling tools; the page renders each tool result as a card.
- For weather questions, call showWeather once per city. The card already shows every number,
  so afterwards reply with one short sentence (for example, what to wear). Don't repeat the data.
- For quizzes, call createQuiz with questions and options only, then stop: the user answers on
  the page. Never reveal the answers before you receive them.
- When createQuiz returns the user's answers, grade each one yourself and call showQuizResults,
  then reply with one short, encouraging sentence. Don't repeat the results in your text.
- If createQuiz returns skipped: true, the user moved on: don't grade it, mention it or make it
  again unless they ask. Just answer their new message.
- If a tool fails, explain the problem in one sentence and suggest a fix.`

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

    // Never trust the request body: check it has the shape of chat messages. Passing the
    // tools also checks the inputs and outputs of earlier tool calls against their schemas.
    let messages: GenUIMessage[]
    try {
      messages = await validateUIMessages<GenUIMessage>({ messages: body?.messages, tools: genuiTools })
    }
    catch {
      throw createError({ statusCode: 400, statusMessage: 'Invalid chat messages' })
    }

    const result = streamText({
      model: google(aiModel),
      instructions: INSTRUCTIONS,
      // UI messages (what the page shows) -> model messages (what the LLM reads).
      // A tool call without a result would be rejected by the model API. The page marks
      // unanswered quizzes as skipped, but a call can still be cut off (e.g. the user pressed
      // Stop mid-stream): ignoreIncompleteToolCalls leaves those calls out as a safety net.
      messages: await convertToModelMessages(messages, { ignoreIncompleteToolCalls: true }),
      // The tools the model may call (auto-imported from server/utils/genui-tools.ts).
      tools: genuiTools,
      // A "step" is one call to Gemini. Step 1: the model calls a tool. Step 2: it reads the
      // result and writes its reply. The limit stops loops and protects the free-tier quota.
      stopWhen: isStepCount(3),
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
        // Failed tool calls keep their own error text (e.g. "No city found..."), the same text
        // the model sees, instead of being replaced by the result of onError.
        redactToolErrors: false,
      }),
    })
  })
})
