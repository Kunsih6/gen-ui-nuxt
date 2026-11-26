<!-- Auto-registered as <GenuiWeatherCard> (folder name + file name). It knows nothing about AI:
     it renders a Weather object, whoever produced it. -->
<script setup lang="ts">
import type { Weather } from '#shared/genui'

defineProps<{ data: Weather }>()

// Presentation only: WMO weather code -> Lucide icon. The words come from the server.
function iconFor(code: number, isDay = true) {
  if (code <= 1)
    return isDay ? 'i-lucide-sun' : 'i-lucide-moon'
  if (code === 2)
    return isDay ? 'i-lucide-cloud-sun' : 'i-lucide-cloud-moon'
  if (code === 3)
    return 'i-lucide-cloud'
  if (code === 45 || code === 48)
    return 'i-lucide-cloud-fog'
  if (code >= 51 && code <= 57)
    return 'i-lucide-cloud-drizzle'
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
    return 'i-lucide-cloud-rain'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return 'i-lucide-cloud-snow'
  return 'i-lucide-cloud-lightning'
}

// "2026-11-25" -> "Wed". Noon avoids the date shifting a day in time zones behind UTC.
function weekday(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en', { weekday: 'short' })
}
</script>

<template>
  <UCard class="my-2 max-w-md" :ui="{ body: 'space-y-4' }">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="flex items-center gap-1 text-sm text-muted">
          <UIcon class="size-4" name="i-lucide-map-pin" />
          {{ data.location }}
        </p>
        <p class="mt-1 text-5xl font-semibold">
          {{ data.current.temperature }}°C
        </p>
        <p class="text-muted">
          {{ data.current.condition }}
        </p>
      </div>
      <UIcon class="size-16 shrink-0 text-primary" :name="iconFor(data.current.code, data.current.isDay)" />
    </div>

    <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
      <span class="flex items-center gap-1">
        <UIcon name="i-lucide-thermometer" />
        Feels like {{ data.current.feelsLike }}°
      </span>
      <span class="flex items-center gap-1">
        <UIcon name="i-lucide-droplets" />
        {{ data.current.humidity }}% humidity
      </span>
      <span class="flex items-center gap-1">
        <UIcon name="i-lucide-wind" />
        {{ data.current.windSpeed }} km/h
      </span>
    </div>

    <USeparator />

    <ul class="grid grid-cols-5 gap-2 text-center text-sm">
      <li v-for="day in data.daily" :key="day.date" class="flex flex-col items-center gap-1">
        <span class="text-muted">{{ weekday(day.date) }}</span>
        <UIcon class="size-6" :name="iconFor(day.code)" />
        <span class="sr-only">{{ day.condition }}</span>
        <span>
          {{ day.max }}° <span class="text-muted">{{ day.min }}°</span>
        </span>
      </li>
    </ul>
  </UCard>
</template>
