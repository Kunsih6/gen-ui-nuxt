<!-- <GenuiQuizResultsCard>: the model's grading of a quiz (the showQuizResults input). -->
<script setup lang="ts">
import type { QuizResults, QuizScore } from '#shared/genui'

const props = defineProps<{
  data: QuizResults
  // The score counted by the server (the tool's output). Until it arrives, count here.
  output?: QuizScore
}>()

const total = computed(() => props.output?.total ?? props.data.results.length)
const score = computed(() => props.output?.score ?? props.data.results.filter(result => result.correct).length)

function look(correct: boolean) {
  if (correct)
    return { icon: 'i-lucide-circle-check', color: 'text-success' }
  return { icon: 'i-lucide-circle-x', color: 'text-error' }
}
</script>

<template>
  <UCard class="my-2 max-w-xl" :ui="{ body: 'space-y-4' }">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h3 class="font-semibold">
          Results
        </h3>
        <UBadge
          size="lg"
          variant="subtle"
          :color="score === total ? 'success' : 'neutral'"
          :label="`${score}/${total}`"
        />
      </div>
    </template>

    <ul class="space-y-4">
      <li v-for="(result, i) in data.results" :key="i" class="flex gap-3">
        <UIcon
          class="mt-0.5 size-5 shrink-0"
          :class="look(result.correct).color"
          :name="look(result.correct).icon"
        />
        <div class="space-y-1">
          <p class="font-medium">
            {{ i + 1 }}. {{ result.question }}
          </p>
          <!-- Words as well as color, so the result doesn't rely on color alone. -->
          <p v-if="result.correct" class="text-sm text-success">
            Correct
          </p>
          <p v-else class="text-sm text-error">
            Wrong. Right answer: <strong>{{ result.correctAnswer }}</strong>
          </p>
          <p class="text-sm text-muted">
            {{ result.explanation }}
          </p>
        </div>
      </li>
    </ul>
  </UCard>
</template>
