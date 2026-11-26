<!-- Renders one tool call from the chat (<GenuiToolPart>). This is the client side of GenUI:
     the model chose a tool, and this component picks the Vue component that shows its result. -->
<script setup lang="ts">
import type { Component } from 'vue'
import type { GenUIToolName, GenUIToolPart } from '#shared/genui'
import { isToolStreaming } from '@nuxt/ui/utils/ai'
import { getToolName } from 'ai'
import { GenuiWeatherCard } from '#components'

const props = defineProps<{
  part: GenUIToolPart
  // From UChatMessages: false once the message stops streaming (e.g. the user pressed Stop).
  streaming: boolean
}>()

interface RegistryEntry {
  component: Component
  loadingText: string
}

// The component registry: tool name -> the component that renders its output.
// `satisfies` makes TypeScript complain if a tool in the catalog has no component.
const registry = {
  showWeather: { component: GenuiWeatherCard, loadingText: 'Checking the weather' },
} satisfies Record<GenUIToolName, RegistryEntry>

const name = computed(() => getToolName(props.part))
const entry = computed<RegistryEntry | undefined>(() => registry[name.value as GenUIToolName])
</script>

<template>
  <!-- A tool part moves through states: input-streaming -> input-available -> output-available
       (or output-error). We show a loader until the output exists. -->
  <component
    :is="entry.component"
    v-if="part.state === 'output-available' && entry"
    :data="part.output"
  />

  <UChatTool
    v-else-if="part.state === 'output-error'"
    error
    :text="`${name} failed`"
  >
    <p class="text-sm text-muted">
      {{ part.errorText }}
    </p>
  </UChatTool>

  <UChatTool
    v-else
    :streaming="isToolStreaming(part, streaming)"
    :text="entry?.loadingText ?? name"
  />
</template>
