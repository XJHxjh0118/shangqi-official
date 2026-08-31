<script setup lang="ts">
import type { Product } from '~/data/products'

const props = defineProps<{
  items: Product[]
  viewMode: 'grid' | 'list'
  variant?: 'main' | 'portal'
  loadingMore?: boolean
  hasMore?: boolean
  refreshing?: boolean
}>()

const emit = defineEmits<{
  loadMore: []
}>()

const { t } = useI18n()
const variant = computed(() => props.variant ?? 'main')

const sentinelRef = ref<HTMLElement | null>(null)
const canLoadMore = computed(
  () => Boolean(props.hasMore) && !props.loadingMore && !props.refreshing,
)

useIntersectionObserver(
  sentinelRef,
  (entries) => {
    const entry = entries[0]
    if (!entry?.isIntersecting || !canLoadMore.value) return
    emit('loadMore')
  },
  { rootMargin: '320px 0px' },
)

const gridClass = computed(() =>
  variant.value === 'portal' ? 'p-catalog-grid' : 'product-grid',
)

const showFooter = ref(false)

onMounted(() => {
  showFooter.value = true
})
</script>

<template>
  <div class="catalog-list-wrap">
    <div
      class="catalog-list"
      :class="[gridClass, { 'is-list': viewMode === 'list' }]"
      :style="{ viewTransitionName: variant === 'portal' ? 'portal-catalog' : 'product-catalog' }"
    >
      <template v-if="variant === 'portal'">
        <PortalProductCard
          v-for="product in items"
          :key="product.id"
          class="catalog-list-item"
          :product="product"
          :list-mode="viewMode === 'list'"
          :style="{ viewTransitionName: `portal-product-${product.id}` }"
        />
      </template>
      <template v-else>
        <ProductCard
          v-for="product in items"
          :key="product.id"
          class="catalog-list-item"
          :product="product"
          :mode="viewMode"
          :style="{ viewTransitionName: `product-${product.id}` }"
        />
      </template>
    </div>

    <div ref="sentinelRef" class="catalog-sentinel" aria-hidden="true" />

    <div v-if="showFooter && loadingMore" class="catalog-footer is-loading">
      <span class="catalog-footer-spinner" />
      <span>{{ t('products.loadingMore') }}</span>
    </div>
    <div
      v-else-if="showFooter && !hasMore && items.length"
      class="catalog-footer is-end"
    >
      {{ t('products.noMore') }}
    </div>
  </div>
</template>
