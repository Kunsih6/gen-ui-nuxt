<!-- <GenuiQuizCard>: an interactive quiz. The model wrote the questions and options (the
     createQuiz input) but not the answers: the user's choices are sent back to the model,
     which grades them in a separate results card. -->
<script setup lang="ts">
import type { Quiz, QuizAnswers } from '#shared/genui'

const props = defineProps<{
  data: Quiz
  // The answers once sent, or `skipped: true` if the user sent a new message instead
  // (the tool's output). Undefined while the user is answering.
  output?: QuizAnswers
}>()

const emit = defineEmits<{
  // Sends the user's answers as the result of the createQuiz tool call.
  respond: [output: QuizAnswers]
}>()

// The option the user picked for each question. They can change it until they submit.
const selected = ref<(number | undefined)[]>([])
// True from the click on Submit, before the answers come back through `output`.
const sending = ref(false)

const submitted = computed(() => sending.value || props.output !== undefined)
const skipped = computed(() => props.output?.skipped === true)
const total = computed(() => props.data.questions.length)
const answeredCount = computed(() => selected.value.filter(choice => choice !== undefined).length)

// The chosen option of a question: from the sent answers once submitted, else local state.
function chosenIndex(questionIndex: number) {
  const sent = props.output?.answers[questionIndex]
  if (sent !== undefined)
    return props.data.questions[questionIndex]!.options.indexOf(sent)
  return selected.value[questionIndex]
}

function choose(questionIndex: number, optionIndex: number) {
  if (!submitted.value)
    selected.value[questionIndex] = optionIndex
}

function submit() {
  sending.value = true
  // Send the option texts, not their positions: they're unambiguous for the model to grade.
  emit('respond', {
    answers: props.data.questions.map((q, i) => q.options[selected.value[i]!]!),
    skipped: false,
  })
}

// Only the user's choice is highlighted: this card never knows the right answers.
function optionLook(questionIndex: number, optionIndex: number) {
  if (chosenIndex(questionIndex) === optionIndex)
    return { color: 'primary', variant: 'soft', icon: 'i-lucide-circle-dot' } as const
  if (submitted.value)
    return { color: 'neutral', variant: 'ghost', icon: 'i-lucide-circle' } as const
  return { color: 'neutral', variant: 'outline', icon: 'i-lucide-circle' } as const
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
          :aria-pressed="chosenIndex(qi) === oi"
          :disabled="submitted"
          :label="option"
          v-bind="optionLook(qi, oi)"
          @click="choose(qi, oi)"
        />
      </div>
    </section>

    <template #footer>
      <!-- aria-live announces the change to screen readers when the answers are sent. -->
      <div aria-live="polite" class="flex items-center justify-between gap-2">
        <p v-if="skipped" class="flex items-center gap-2 text-sm text-muted">
          <UIcon name="i-lucide-circle-slash" />
          Skipped. You sent a new message instead.
        </p>
        <p v-else-if="submitted" class="flex items-center gap-2 text-sm text-muted">
          <UIcon name="i-lucide-hourglass" />
          Answers sent. The assistant grades them below.
        </p>
        <template v-else>
          <p class="text-sm text-muted">
            {{ answeredCount }}/{{ total }} answered
          </p>
          <UButton
            icon="i-lucide-send"
            label="Submit answers"
            :disabled="answeredCount < total"
            @click="submit"
          />
        </template>
      </div>
    </template>
  </UCard>
</template>
