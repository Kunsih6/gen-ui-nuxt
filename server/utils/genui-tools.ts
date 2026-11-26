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
      + 'Use it when the user asks for a quiz, a test or practice questions on a topic.',
    inputSchema: genuiSchemas.createQuiz.inputSchema,
    outputSchema: genuiSchemas.createQuiz.outputSchema,
    strict: true,
    // Nothing to fetch: the model already wrote the whole quiz as the input. We still need
    // `execute`, because a tool without it waits for the browser to answer (that's Phase 4).
    execute: ({ questions }) => ({ questionCount: questions.length }),
  }),
}
