<!-- Renders one tool call from the chat (<GenuiToolPart>). This is the client side of GenUI:
     the model chose a tool, and this component picks the Vue component that shows its result. -->
<script setup lang="ts">
import type { ChatAddToolOutputFunction } from 'ai'
import type { Component } from 'vue'
import type { GenUIMessage, GenUIToolName, GenUIToolPart, GenUITools } from '#shared/genui'
import { isToolStreaming } from '@nuxt/ui/utils/ai'
import { getToolName } from 'ai'
import { GenuiQuizCard, GenuiQuizResultsCard, GenuiWeatherCard } from '#components'

// The argument of useChat's addToolOutput: which tool call gets which result.
type ToolOutput = Parameters<ChatAddToolOutputFunction<GenUIMessage>>[0]

const props = defineProps<{
  part: GenUIToolPart
  // From UChatMessages: false once the message stops streaming (e.g. the user pressed Stop).
  streaming: boolean
}>()

const emit = defineEmits<{
  // The user answered a client-side tool (the quiz). index.vue passes it to addToolOutput.
  toolOutput: [ToolOutput]
}>()

interface RegistryEntry {
  component: Component
  // Where the component's data comes from:
  // - 'output': what `execute` returned (the weather fetched by the server).
  // - 'input': the arguments the model wrote (the quiz, the grading).
  renderFrom: 'input' | 'output'
  loadingText: string
}

// The component registry: tool name -> the component that renders it.
// `satisfies` makes TypeScript complain if a tool in the catalog has no component.
const registry = {
  showWeather: { component: GenuiWeatherCard, renderFrom: 'output', loadingText: 'Checking the weather' },
  createQuiz: { component: GenuiQuizCard, renderFrom: 'input', loadingText: 'Writing the quiz' },
  showQuizResults: { component: GenuiQuizResultsCard, renderFrom: 'input', loadingText: 'Grading your answers' },
} satisfies Record<GenUIToolName, RegistryEntry>

const name = computed(() => getToolName(props.part))
const entry = computed<RegistryEntry | undefined>(() => registry[name.value as GenUIToolName])

// The component's props, or undefined while its data isn't ready yet.
// `data` is what it renders. Components drawn from the input also get `output`,
// the tool's result once it exists (for the quiz: the answers the user sent).
const componentProps = computed(() => {
  const { part } = props
  if (!entry.value)
    return undefined
  if (entry.value.renderFrom === 'output') {
    if (part.state === 'output-available')
      return { data: part.output }
    return undefined
  }
  // The input is complete once the model has finished writing it (any state after
  // 'input-streaming'). Gemini sends it in one piece; other providers stream it.
  if (part.state === 'input-streaming')
    return undefined
  if (part.state === 'output-available')
    return { data: part.input, output: part.output }
  return { data: part.input }
})

// Called by components that collect the tool's result from the user (client-side tools).
// The output is one of our tools' outputs, from the contract in shared/genui.ts.
function respond(output: GenUITools[GenUIToolName]['output']) {
  emit('toolOutput', { tool: name.value as GenUIToolName, toolCallId: props.part.toolCallId, output })
}
</script>

<template>
  <!-- A tool part moves through states: input-streaming -> input-available -> output-available
       (or output-error). We show a loader until the component's data is ready. A client-side
       tool (the quiz) waits in input-available until the user answers. -->
  <UChatTool
    v-if="part.state === 'output-error'"
    error
    :text="`${name} failed`"
  >
    <p class="text-sm text-muted">
      {{ part.errorText }}
    </p>
  </UChatTool>

  <component
    :is="entry.component"
    v-else-if="entry && componentProps"
    v-bind="componentProps"
    @respond="respond"
  />

  <UChatTool
    v-else
    :streaming="isToolStreaming(part, streaming)"
    :text="entry?.loadingText ?? name"
  />
</template>
