<script setup lang="ts">
import type { Product } from '~/data/products'
import { getLocalized, vehicleSummary } from '~/data/products'

const props = defineProps<{
  product: Product
  mode?: 'grid' | 'list'
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

const name = computed(() => getLocalized(props.product.name, locale.value))
const isList = computed(() => props.mode === 'list')
const mediaWellRef = ref<HTMLElement | null>(null)

useGridImagePan(mediaWellRef, computed(() => !isList.value))

function filled(value: string) {
  return Boolean(value && value !== '—')
}

const fitment = computed(() => {
  const summary = vehicleSummary(
    props.product.vehicles,
    locale.value,
    isList.value ? 2 : 1,
  )
  if (!summary.text) return ''
  if (!summary.extra) return summary.text
  return `${summary.text} ${t('products.moreFitment', { n: summary.extra })}`
})

const specLine = computed(() => {
  if (!isList.value) return ''
  const parts = [
    getLocalized(props.product.material, locale.value),
    getLocalized(props.product.size, locale.value),
  ].filter(filled)
  return parts.join(' · ')
})
</script>

<template>
  <NuxtLink
    class="product-card"
    :class="{ list: isList }"
    :to="localePath(`/products/${product.slug}`)"
    prefetch
  >
    <div ref="mediaWellRef" class="media-well">
      <img
        :src="product.previewImages[0] || product.images[0]"
        :alt="name"
        width="640"
        height="480"
        loading="lazy"
      />
      <ProductFlags :tags="product.tags" />
    </div>
    <div class="product-card-copy">
      <p class="product-meta">{{ product.sku }}</p>
      <h3>{{ name }}</h3>
      <p v-if="fitment" class="product-spec">{{ fitment }}</p>
      <p v-if="specLine" class="product-spec is-muted">{{ specLine }}</p>
    </div>
  </NuxtLink>
</template>
