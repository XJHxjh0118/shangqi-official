<script setup lang="ts">
import type { Product } from '~/data/products'
import { getLocalized } from '~/data/products'

const props = defineProps<{
  product: Product
  mode?: 'grid' | 'list'
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

const name = computed(() => getLocalized(props.product.name, locale.value))
const description = computed(() =>
  getLocalized(props.product.description, locale.value),
)
const isList = computed(() => props.mode === 'list')
</script>

<template>
  <NuxtLink
    class="product-card"
    :class="{ list: isList }"
    :to="localePath(`/products/${product.slug}`)"
    prefetch
  >
    <div class="media-well">
      <img :src="product.images[0]" :alt="name" width="640" height="480" />
    </div>
    <div>
      <p class="product-meta">
        {{ product.sku }}
        <template v-if="product.tags.includes('new')"> · {{ t('products.new') }}</template>
        <template v-if="product.tags.includes('hot')"> · {{ t('products.hot') }}</template>
      </p>
      <h3>{{ name }}</h3>
      <p v-if="isList">{{ description }}</p>
    </div>
  </NuxtLink>
</template>
