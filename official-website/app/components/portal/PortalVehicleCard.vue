<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  to: string
}>()
</script>

<template>
  <NuxtLink class="p-vehicle-card p-reveal" :to="to">
    <strong>{{ title }}</strong>
    <span>{{ subtitle }}</span>
  </NuxtLink>
</template>
