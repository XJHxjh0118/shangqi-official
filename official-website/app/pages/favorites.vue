<script setup lang="ts">
import type { FavoriteItem } from '~/composables/useFavorites'

definePageMeta({
  middleware: 'auth',
})

const { t } = useI18n()
const localePath = useLocalePath()
const { items, remove } = useFavorites()
const { toggleItem, has: inInquiry } = useInquiryList()

useSeoGeo({
  title: t('account.favoritesTitle'),
  description: t('account.favoritesDesc'),
})

function onAddInquiry(item: FavoriteItem) {
  toggleItem({
    id: item.id,
    sku: item.sku,
    name: item.name,
    image: item.image,
    slug: item.slug,
  })
}
</script>

<template>
  <div class="page">
    <div class="container">
      <header class="page-head">
        <h1>{{ t('account.favoritesTitle') }}</h1>
        <p>{{ t('account.favoritesDesc') }}</p>
      </header>

      <div v-if="!items.length" class="empty-state">
        <p>{{ t('account.favoritesEmpty') }}</p>
        <p style="margin-top: 16px">
          <NuxtLink class="btn btn-primary" :to="localePath('/products')">
            {{ t('inquiry.browse') }}
          </NuxtLink>
        </p>
      </div>
      <ul v-else>
        <li v-for="item in items" :key="item.id" class="inquiry-item">
          <img :src="item.image" :alt="item.name" width="72" height="54" />
          <div>
            <NuxtLink :to="localePath(`/products/${item.slug}`)">
              <strong>{{ item.name }}</strong>
            </NuxtLink>
            <p class="product-meta">{{ item.sku }}</p>
          </div>
          <div class="inquiry-item-actions">
            <button
              class="btn btn-primary"
              type="button"
              :aria-pressed="inInquiry(item.id)"
              @click="onAddInquiry(item)"
            >
              {{ inInquiry(item.id) ? t('detail.added') : t('detail.addInquiry') }}
            </button>
            <button
              class="btn btn-ghost"
              type="button"
              @click="remove(item.id)"
            >
              {{ t('common.remove') }}
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
