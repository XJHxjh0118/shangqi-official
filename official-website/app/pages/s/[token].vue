<script setup lang="ts">
import { mapApiProduct } from '~/utils/mapProduct'
import { useCachedAsyncData } from '~/composables/useDataCache'

const route = useRoute()
const { t } = useI18n()
const { apiBase, getShare } = useApi()
const token = computed(() => String(route.params.token || ''))

const { data, pending, error } = useCachedAsyncData(
  () => `share-${token.value}`,
  () => getShare(token.value),
  { watch: [token] },
)

const products = computed(() =>
  (data.value?.products || []).map((p) => mapApiProduct(p, apiBase)),
)

useSeoGeo({
  title: () => data.value?.title || t('account.shareTitle'),
  description: t('account.shareDesc'),
})
</script>

<template>
  <div class="page">
    <div class="container">
      <header class="page-head">
        <h1>{{ data?.title || t('account.shareTitle') }}</h1>
        <p>{{ t('account.shareDesc') }}</p>
      </header>
      <p v-if="pending">{{ t('common.loading') }}</p>
      <p v-else-if="error" class="notice err">{{ t('account.shareMissing') }}</p>
      <div v-else class="product-grid">
        <ProductCard v-for="p in products" :key="p.id" :product="p" />
      </div>
    </div>
  </div>
</template>
