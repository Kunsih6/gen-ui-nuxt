<template>
  <!-- UApp provides the global context Nuxt UI needs (toasts, tooltips, overlays). -->
  <UApp>
    <!-- Announces route changes to screen readers. -->
    <NuxtRouteAnnouncer />
    <!-- Renders the page matching the current URL, from app/pages/. -->
    <NuxtPage />
  </UApp>
</template>
