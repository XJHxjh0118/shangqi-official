<script setup lang="ts">
import type { Product } from '~/data/products'

const props = defineProps<{
  tags: Product['tags']
}>()

const { t } = useI18n()

const items = computed(() => {
  const order = ['featured', 'new', 'hot'] as const
  return order
    .filter((key) => props.tags.includes(key))
    .map((key) => ({
      key,
      label: t(`products.${key}`),
    }))
})
</script>

<template>
  <div v-if="items.length" class="product-flags">
    <span
      v-for="item in items"
      :key="item.key"
      class="product-flag"
      :class="{ 'is-featured': item.key === 'featured' }"
    >
      {{ item.label }}
    </span>
  </div>
</template>
