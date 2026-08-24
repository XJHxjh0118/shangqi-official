<script setup lang="ts">
withDefaults(
  defineProps<{
    src: string
    alt: string
    zoom?: number
  }>(),
  { zoom: 2.2 },
)
</script>

<template>
  <img :src="src" :alt="alt" />
</template>
