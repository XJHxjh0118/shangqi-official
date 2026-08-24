<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
  }>(),
  { count: 8 },
)
</script>

<template>
  <div class="skeleton-grid" aria-hidden="true">
    <div v-for="n in count" :key="n" class="skeleton-card" />
  </div>
</template>
