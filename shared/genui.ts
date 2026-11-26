// The GenUI contract, shared by the server (tools) and the app (components).
// Code in shared/ can't import Vue or Nitro code, only plain libraries like zod.
import type { ToolUIPart, UIDataTypes, UIMessage } from 'ai'
import { z } from 'zod'

// --- showWeather --------------------------------------------------------------

// Input: what the model must send when it calls the tool. The .describe() texts are
// sent to the model as part of the tool definition, so they work like a mini prompt.
const weatherInputSchema = z.object({
  city: z.string().describe('City name in English, e.g. "Guatemala City" or "Madrid"'),
})

// Output: what the server returns. The model reads it to write its reply,
// and the WeatherCard component renders it.
const weatherSchema = z.object({
  location: z.string(),
  current: z.object({
    temperature: z.number(), // °C
    feelsLike: z.number(), // °C
    humidity: z.number(), // %
    windSpeed: z.number(), // km/h
    code: z.number(), // WMO weather code, used by the UI to pick an icon
    condition: z.string(), // the same code in words, for the model
    isDay: z.boolean(),
  }),
  daily: z.array(z.object({
    date: z.string(), // YYYY-MM-DD
    code: z.number(),
    condition: z.string(),
    min: z.number(),
    max: z.number(),
  })),
})

export type Weather = z.infer<typeof weatherSchema>

// --- createQuiz ---------------------------------------------------------------

// Here the INPUT is the content: the model writes the quiz as the tool's arguments.
// Only questions and options: no correct answers, so the browser can't see them.
// Every .describe() steers what the model writes, so be precise.
const quizSchema = z.object({
  title: z.string().describe('Short title for the quiz, e.g. "Vue basics"'),
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).min(2).max(4).describe('2 to 4 possible answers, exactly one of them right'),
  })).min(1).max(5).describe('1 to 5 questions, 3 if the user does not say'),
})

// The OUTPUT doesn't come from the server: the browser sends it when the user submits,
// or marks the quiz as skipped when the user sends a new message instead of answering.
// The option texts (not their positions) are unambiguous for the model to grade.
const quizAnswersSchema = z.object({
  answers: z.array(z.string()).describe('The option the user chose for each question, in order'),
  skipped: z.boolean().describe('True if the user sent a new message instead of answering; '
    + '`answers` is then empty'),
})

export type Quiz = z.infer<typeof quizSchema>
export type QuizAnswers = z.infer<typeof quizAnswersSchema>

// --- showQuizResults ----------------------------------------------------------

// Input: the model's grading of the user's answers, drawn as a results card.
const quizResultsSchema = z.object({
  results: z.array(z.object({
    question: z.string().describe('The question, copied from the quiz'),
    correct: z.boolean().describe('Whether the user\'s answer is right'),
    correctAnswer: z.string().describe('The text of the right option'),
    explanation: z.string().describe('One sentence explaining the right answer'),
  })).describe('One entry per quiz question, in the same order as the quiz'),
})

// Output: the score, counted by our code rather than by the model.
const quizScoreSchema = z.object({
  score: z.number(),
  total: z.number(),
})

export type QuizResults = z.infer<typeof quizResultsSchema>
export type QuizScore = z.infer<typeof quizScoreSchema>

// --- The catalog ----------------------------------------------------------------

// Every tool the model can call, with the schemas of its input and output.
// Adding a GenUI component starts here.
export const genuiSchemas = {
  showWeather: { inputSchema: weatherInputSchema, outputSchema: weatherSchema },
  createQuiz: { inputSchema: quizSchema, outputSchema: quizAnswersSchema },
  showQuizResults: { inputSchema: quizResultsSchema, outputSchema: quizScoreSchema },
}

type Schemas = typeof genuiSchemas

// TypeScript types derived from the schemas, so they can never drift apart.
export type GenUITools = {
  [Name in keyof Schemas]: {
    input: z.infer<Schemas[Name]['inputSchema']>
    output: z.infer<Schemas[Name]['outputSchema']>
  }
}
export type GenUIToolName = keyof GenUITools

// A chat message whose tool parts are typed: a `tool-showWeather` part has a typed
// `input` ({ city }) and `output` (Weather); a `tool-createQuiz` part has a Quiz `input`
// and the user's QuizAnswers as `output`.
export type GenUIMessage = UIMessage<unknown, UIDataTypes, GenUITools>
export type GenUIToolPart = ToolUIPart<GenUITools>
