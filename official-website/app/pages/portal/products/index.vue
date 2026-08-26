<script setup lang="ts">
import { vehicleLabel } from '~/data/products'

definePageMeta({
  layout: 'portal',
})

const catalog = useProductsCatalog({ basePath: '/portal/products' })
const {
  t,
  locale,
  q,
  category,
  vehicleId,
  viewMode,
  pending,
  list,
  flatCategories,
  vehicles,
  applyFilters,
  getLocalized,
  localePath,
} = catalog

const pageRoot = ref<HTMLElement | null>(null)
const { refresh: refreshReveal } = usePortalReveal(pageRoot)

watch(
  () => [list.value.length, viewMode.value, pending.value],
  async () => {
    await nextTick()
    refreshReveal()
  },
)
</script>

<template>
  <div ref="pageRoot" class="p-section catalog-page">
    <SeoGeoItemList
      :items="
        list.map((p) => ({
          name: getLocalized(p.name, locale),
          url: localePath(`/portal/products/${p.slug}`),
        }))
      "
    />
    <div class="p-section-head">
      <div class="p-eyebrow">Product Catalog</div>
      <h1>{{ t('products.title') }}</h1>
      <p>{{ t('products.desc') }}</p>
    </div>

    <form class="p-toolbar p-reveal" @submit.prevent="applyFilters">
      <label>
        <span>{{ t('products.searchPlaceholder') }}</span>
        <input v-model="q" type="search" :placeholder="t('products.searchPlaceholder')" />
      </label>
      <label>
        <span>{{ t('products.filterCategory') }}</span>
        <select
          :value="category || ''"
          @change="
            category = ($event.target as HTMLSelectElement).value || null;
            applyFilters()
          "
        >
          <option value="">{{ t('products.filterCategory') }}</option>
          <option v-for="c in flatCategories" :key="c.code" :value="c.code">
            {{ c.label }}
          </option>
        </select>
      </label>
      <label>
        <span>{{ t('products.filterVehicle') }}</span>
        <select
          :value="vehicleId || ''"
          @change="
            vehicleId = ($event.target as HTMLSelectElement).value || null;
            applyFilters()
          "
        >
          <option value="">{{ t('products.filterVehicle') }}</option>
          <option v-for="v in vehicles" :key="v.id" :value="String(v.id)">
            {{ vehicleLabel(v, locale) }}
          </option>
        </select>
      </label>
      <div class="p-view-switch" aria-label="view">
        <button
          type="button"
          :class="{ active: viewMode === 'grid' }"
          @click="viewMode = 'grid'"
        >
          ▦
        </button>
        <button
          type="button"
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          ☰
        </button>
      </div>
    </form>

    <div v-if="pending && !list.length" class="p-empty">{{ t('common.loading') }}</div>
    <div v-else-if="!list.length" class="p-empty">{{ t('products.noResult') }}</div>
    <div v-else class="p-catalog-grid" :class="{ 'is-list': viewMode === 'list' }">
      <PortalProductCard
        v-for="product in list"
        :key="product.id"
        :product="product"
        :list-mode="viewMode === 'list'"
      />
    </div>
  </div>
</template>
