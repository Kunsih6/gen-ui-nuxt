<script setup lang="ts">
import { useChat } from '@ai-sdk/vue'
import { isPartStreaming } from '@nuxt/ui/utils/ai'
import { isTextUIPart } from 'ai'

const input = ref('')

// useChat keeps the conversation state and talks to POST /api/chat (its default endpoint).
// - messages: every message so far, each one a list of `parts` (text now, UI components later).
// - status: 'ready' | 'submitted' (waiting for the first token) | 'streaming' | 'error'.
const { messages, status, error, sendMessage, regenerate, stop } = useChat({
  onError(error) {
    console.error(error)
  },
})

function onSubmit() {
  sendMessage({ text: input.value })
  input.value = ''
}
</script>

<template>
  <UContainer class="flex min-h-dvh max-w-3xl flex-col py-6">
    <div v-if="!messages.length" class="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <h1 class="text-2xl font-semibold">
        GenUI demo
      </h1>
      <p class="text-muted">
        Ask anything to start.
      </p>
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
      @submit="onSubmit"
    >
      <UChatPromptSubmit :status="status" @reload="regenerate()" @stop="stop()" />
    </UChatPrompt>
  </UContainer>
</template>
