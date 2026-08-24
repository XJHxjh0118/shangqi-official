<script setup lang="ts">
withDefaults(
  defineProps<{
    src: string
    alt?: string
    eager?: boolean
  }>(),
  {
    alt: '',
    eager: false,
  },
)
</script>

<template>
  <img
    :src="src"
    :alt="alt"
    decoding="async"
    :loading="eager ? 'eager' : 'lazy'"
  >
</template>
