// The tools the model can call. Each one is a piece of UI the model can ask the page to show.
import { tool } from 'ai'
import { genuiSchemas } from '#shared/genui'

export const genuiTools = {
  showWeather: tool({
    // The description is part of the prompt: it tells the model WHEN to use the tool.
    description: 'Show the current weather and a 5-day forecast for a city as a visual card. '
      + 'Use it whenever the user asks about the weather, temperature or forecast of a place.',
    inputSchema: genuiSchemas.showWeather.inputSchema,
    outputSchema: genuiSchemas.showWeather.outputSchema,
    // Asks the provider to force the arguments to match the schema while the model writes
    // them (Gemini's "VALIDATED" mode). The SDK still checks them with zod afterwards.
    strict: true,
    // Runs on the server when the model calls the tool. The returned value is
    // streamed to the page (to render the card) and fed back to the model.
    execute: ({ city }) => getWeather(city), // auto-imported from server/utils/open-meteo.ts
  }),

  createQuiz: tool({
    description: 'Show an interactive multiple-choice quiz that the user answers by clicking. '
      + 'Use it when the user asks for a quiz, a test or practice questions on a topic. '
      + 'Write only the questions and options, never the answers. The result of this tool is '
      + 'the option the user chose for each question.',
    inputSchema: genuiSchemas.createQuiz.inputSchema,
    outputSchema: genuiSchemas.createQuiz.outputSchema,
    strict: true,
    // No `execute`: this is a client-side tool. The server stops after the model calls it,
    // and the browser provides the result (the user's answers) with addToolOutput.
  }),

  showQuizResults: tool({
    description: 'Show the grading of a quiz as a results card. Call it right after you receive '
      + 'the user\'s answers from createQuiz, with one entry per question.',
    inputSchema: genuiSchemas.showQuizResults.inputSchema,
    outputSchema: genuiSchemas.showQuizResults.outputSchema,
    strict: true,
    // The model grades; our code only counts, so the score can't be miscounted.
    execute: ({ results }) => ({
      score: results.filter(result => result.correct).length,
      total: results.length,
    }),
  }),
}
