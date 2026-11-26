// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    // Component library (UButton, UChatMessages, ...). Also registers @nuxt/icon, @nuxt/fonts and color mode.
    '@nuxt/ui',
    // <Markdown> component that renders the model's streaming Markdown replies.
    '@comark/vue',
  ],

  css: ['~/assets/css/main.css'],

  // Keys at the top level are server-only: they are never sent to the browser.
  // Each one can be overridden by an env variable: googleApiKey <- NUXT_GOOGLE_API_KEY.
  runtimeConfig: {
    googleApiKey: '',
    aiModel: 'gemini-3.5-flash-lite',
  },

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})
