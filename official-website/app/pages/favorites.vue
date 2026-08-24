<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { items, remove } = useFavorites()

useSeoGeo({
  title: t('account.favoritesTitle'),
  description: t('account.favoritesDesc'),
})
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
          <span />
          <button class="btn btn-ghost" type="button" style="min-width: auto" @click="remove(item.id)">
            {{ t('common.remove') }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
