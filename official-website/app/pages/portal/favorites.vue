<script setup lang="ts">
import type { FavoriteItem } from '~/composables/useFavorites'

definePageMeta({
  layout: 'portal',
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
  <div class="p-section">
    <div class="p-section-head">
      <div class="p-eyebrow">Favorites</div>
      <h1>{{ t('account.favoritesTitle') }}</h1>
      <p>{{ t('account.favoritesDesc') }}</p>
    </div>

    <div v-if="!items.length" class="p-empty">
      <p>{{ t('account.favoritesEmpty') }}</p>
      <p style="margin-top: 16px">
        <NuxtLink class="p-btn" :to="localePath('/portal/products')">
          {{ t('inquiry.browse') }}
        </NuxtLink>
      </p>
    </div>

    <div v-else class="p-list">
      <article v-for="item in items" :key="item.id" class="p-list-item">
        <img v-if="item.image" :src="item.image" :alt="item.name" />
        <div v-else />
        <div>
          <NuxtLink :to="localePath(`/portal/products/${item.slug}`)">
            <strong>{{ item.name }}</strong>
          </NuxtLink>
          <p class="p-meta">{{ item.sku }}</p>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap">
          <button class="p-btn" type="button" @click="onAddInquiry(item)">
            {{ inInquiry(item.id) ? t('detail.added') : t('detail.addInquiry') }}
          </button>
          <button class="p-btn-ghost" type="button" @click="remove(item.id)">
            {{ t('common.remove') }}
          </button>
        </div>
      </article>
    </div>
  </div>
</template>
