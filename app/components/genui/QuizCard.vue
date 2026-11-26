<!-- <GenuiQuizCard>: an interactive quiz. All its content (questions, options, answers)
     was written by the model as the createQuiz tool's input. -->
<script setup lang="ts">
import type { Quiz } from '#shared/genui'

const props = defineProps<{ data: Quiz }>()

// The option the user picked for each question. They can change it until they submit.
// These answers live only in this component: the model never sees them (that's Phase 4).
const selected = ref<(number | undefined)[]>([])
// Results stay hidden until every question has an answer and the user submits.
const submitted = ref(false)

const total = computed(() => props.data.questions.length)
const answeredCount = computed(() => selected.value.filter(choice => choice !== undefined).length)
const score = computed(() => props.data.questions.filter((q, i) => selected.value[i] === q.answerIndex).length)

function choose(questionIndex: number, optionIndex: number) {
  if (!submitted.value)
    selected.value[questionIndex] = optionIndex
}

function retry() {
  selected.value = []
  submitted.value = false
}

// How an option looks. Before submitting, only the user's choice is highlighted.
// After, the right answer turns green and a wrong choice red.
function optionLook(questionIndex: number, optionIndex: number) {
  const isChosen = selected.value[questionIndex] === optionIndex
  if (!submitted.value) {
    if (isChosen)
      return { color: 'primary', variant: 'soft', icon: 'i-lucide-circle-dot' } as const
    return { color: 'neutral', variant: 'outline', icon: 'i-lucide-circle' } as const
  }
  if (optionIndex === props.data.questions[questionIndex]!.answerIndex)
    return { color: 'success', variant: 'subtle', icon: 'i-lucide-check' } as const
  if (isChosen)
    return { color: 'error', variant: 'subtle', icon: 'i-lucide-x' } as const
  return { color: 'neutral', variant: 'ghost' } as const
}
</script>

<template>
  <UCard class="my-2 max-w-xl" :ui="{ body: 'space-y-6' }">
    <template #header>
      <h3 class="font-semibold">
        {{ data.title }}
      </h3>
    </template>

    <section v-for="(q, qi) in data.questions" :key="qi" class="space-y-2">
      <p class="font-medium">
        {{ qi + 1 }}. {{ q.question }}
      </p>
      <div class="grid gap-2">
        <!-- aria-pressed tells screen readers which option is selected. -->
        <UButton
          v-for="(option, oi) in q.options"
          :key="oi"
          block
          class="justify-start"
          :aria-pressed="selected[qi] === oi"
          :label="option"
          v-bind="optionLook(qi, oi)"
          @click="choose(qi, oi)"
        />
      </div>
      <p v-if="submitted" class="text-sm text-muted">
        {{ selected[qi] === q.answerIndex ? 'Correct!' : 'Not quite.' }} {{ q.explanation }}
      </p>
    </section>

    <template #footer>
      <!-- aria-live announces the score to screen readers when it appears. -->
      <div aria-live="polite" class="flex items-center justify-between gap-2">
        <template v-if="submitted">
          <p class="font-medium">
            Score: {{ score }}/{{ total }}
          </p>
          <UButton
            color="neutral"
            icon="i-lucide-rotate-ccw"
            label="Try again"
            variant="ghost"
            @click="retry"
          />
        </template>
        <template v-else>
          <p class="text-sm text-muted">
            {{ answeredCount }}/{{ total }} answered
          </p>
          <UButton
            icon="i-lucide-send"
            label="Submit answers"
            :disabled="answeredCount < total"
            @click="submitted = true"
          />
        </template>
      </div>
    </template>
  </UCard>
</template>
