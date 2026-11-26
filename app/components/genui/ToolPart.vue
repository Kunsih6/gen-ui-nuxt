<!-- Renders one tool call from the chat (<GenuiToolPart>). This is the client side of GenUI:
     the model chose a tool, and this component picks the Vue component that shows its result. -->
<script setup lang="ts">
import type { Component } from 'vue'
import type { GenUIToolName, GenUIToolPart } from '#shared/genui'
import { isToolStreaming } from '@nuxt/ui/utils/ai'
import { getToolName } from 'ai'
import { GenuiQuizCard, GenuiWeatherCard } from '#components'

const props = defineProps<{
  part: GenUIToolPart
  // From UChatMessages: false once the message stops streaming (e.g. the user pressed Stop).
  streaming: boolean
}>()

interface RegistryEntry {
  component: Component
  // Where the component's data comes from:
  // - 'output': what `execute` returned (the weather fetched by the server).
  // - 'input': the arguments the model wrote (the quiz itself).
  renderFrom: 'input' | 'output'
  loadingText: string
}

// The component registry: tool name -> the component that renders it.
// `satisfies` makes TypeScript complain if a tool in the catalog has no component.
const registry = {
  showWeather: { component: GenuiWeatherCard, renderFrom: 'output', loadingText: 'Checking the weather' },
  createQuiz: { component: GenuiQuizCard, renderFrom: 'input', loadingText: 'Writing the quiz' },
} satisfies Record<GenUIToolName, RegistryEntry>

const name = computed(() => getToolName(props.part))
const entry = computed<RegistryEntry | undefined>(() => registry[name.value as GenUIToolName])

// The data for the component, or undefined while it isn't ready yet.
const data = computed(() => {
  const { part } = props
  if (!entry.value)
    return undefined
  if (entry.value.renderFrom === 'output') {
    if (part.state === 'output-available')
      return part.output
    return undefined
  }
  // The input is complete once the model has finished writing it (any state after
  // 'input-streaming'). Gemini sends it in one piece; other providers stream it.
  if (part.state !== 'input-streaming')
    return part.input
  return undefined
})
</script>

<template>
  <!-- A tool part moves through states: input-streaming -> input-available -> output-available
       (or output-error). We show a loader until the component's data is ready. -->
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
    v-else-if="entry && data"
    :data="data"
  />

  <UChatTool
    v-else
    :streaming="isToolStreaming(part, streaming)"
    :text="entry?.loadingText ?? name"
  />
</template>
