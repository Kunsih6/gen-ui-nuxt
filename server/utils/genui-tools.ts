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
    // Runs on the server when the model calls the tool. The returned value is
    // streamed to the page (to render the card) and fed back to the model.
    execute: ({ city }) => getWeather(city), // auto-imported from server/utils/open-meteo.ts
  }),
}
