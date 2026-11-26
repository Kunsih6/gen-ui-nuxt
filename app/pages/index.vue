<script setup lang="ts">
import type { GenUIMessage } from '#shared/genui'
import { useChat } from '@ai-sdk/vue'
import { isPartStreaming } from '@nuxt/ui/utils/ai'
import { isStaticToolUIPart, isTextUIPart, lastAssistantMessageIsCompleteWithToolCalls } from 'ai'

const input = ref('')

// useChat keeps the conversation state and talks to POST /api/chat (its default endpoint).
// - messages: every message so far, each one a list of `parts` (text, tool calls...).
// - status: 'ready' | 'submitted' (waiting for the first token) | 'streaming' | 'error'.
// - addToolOutput: gives a client-side tool call its result (the quiz answers).
// <GenUIMessage> types the tool parts with the schemas from shared/genui.ts.
const { messages, status, error, sendMessage, regenerate, stop, addToolOutput } = useChat<GenUIMessage>({
  // Once every tool call in the last reply has a result (the user submitted the quiz),
  // send the conversation back to the model without waiting for a new message.
  sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  onError(error) {
    console.error(error)
  },
})

// Example prompts for the empty state, one per GenUI component.
const suggestions = [
  'What\'s the weather in Guatemala City?',
  'Compare the weather in Madrid and Tokyo',
  'Give me a 3-question quiz about Vue',
]

type Part = GenUIMessage['parts'][number]

// A quiz waits for the user's answers (a client-side tool, in state 'input-available').
function isWaitingQuiz(part: Part) {
  return part.type === 'tool-createQuiz' && part.state === 'input-available'
}

// If the user sends a new message instead of answering, mark each waiting quiz as skipped
// first. The model then knows it was skipped (and won't make it again), and the card locks
// instead of waiting forever. We edit `messages` directly instead of calling addToolOutput:
// addToolOutput would trigger sendAutomaticallyWhen and send an extra request right before
// the new message.
function skipWaitingQuizzes() {
  if (!messages.value.some(message => message.parts.some(isWaitingQuiz)))
    return
  messages.value = messages.value.map(message => ({
    ...message,
    parts: message.parts.map((part): Part => {
      if (part.type === 'tool-createQuiz' && part.state === 'input-available') {
        return {
          ...part,
          state: 'output-available',
          output: { answers: [], skipped: true },
        }
      }
      return part
    }),
  }))
}

function send(text: string) {
  skipWaitingQuizzes()
  sendMessage({ text })
  input.value = ''
}
</script>

<template>
  <UContainer class="flex min-h-dvh max-w-3xl flex-col py-6">
    <div v-if="!messages.length" class="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1 class="text-2xl font-semibold">
        GenUI demo
      </h1>
      <p class="text-muted">
        Ask anything, or try one of these:
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <UButton
          v-for="suggestion in suggestions"
          :key="suggestion"
          color="neutral"
          variant="outline"
          :label="suggestion"
          @click="send(suggestion)"
        />
      </div>
    </div>

    <!-- Renders the conversation. The #part slot runs once per message part. -->
    <UChatMessages
      v-else
      class="flex-1"
      should-auto-scroll
      :messages="messages"
      :status="status"
    >
      <template #part="{ part, message, streaming }">
        <!-- The assistant writes Markdown: render it as it streams in. -->
        <Markdown
          v-if="isTextUIPart(part) && message.role === 'assistant'"
          class="*:first:mt-0 *:last:mb-0"
          :streaming="isPartStreaming(part, streaming)"
          :value="part.text"
        />
        <!-- A call to one of our tools: GenUI renders it as a component (see ToolPart.vue). -->
        <GenuiToolPart
          v-else-if="isStaticToolUIPart(part)"
          :part="part"
          :streaming="streaming"
          @tool-output="addToolOutput"
        />
        <!-- Any part not handled above (like the user's own text) gets Nuxt UI's default rendering. -->
      </template>
    </UChatMessages>

    <!-- Show the real error (e.g. free-tier quota or overloaded model) to learn what failed. -->
    <UAlert
      v-if="error"
      class="mb-3"
      color="error"
      icon="i-lucide-circle-alert"
      title="The request failed"
      variant="subtle"
      :description="error.message"
    />

    <!-- The prompt box. Enter submits; the button turns into Stop while streaming and Retry on error. -->
    <UChatPrompt
      v-model="input"
      class="sticky bottom-4"
      placeholder="Type a message..."
      :error="error"
      :status="status"
      @submit="send(input)"
    >
      <UChatPromptSubmit :status="status" @reload="regenerate()" @stop="stop()" />
    </UChatPrompt>
  </UContainer>
</template>
