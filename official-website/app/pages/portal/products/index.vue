<script setup lang="ts">
import { PhCircleNotch, PhMagnifyingGlass } from '@phosphor-icons/vue'
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
  refreshing,
  loadingMore,
  hasMore,
  list,
  flatCategories,
  vehicles,
  applyFilters,
  onSearchInput,
  loadMore,
  getLocalized,
  localePath,
} = catalog

const pageRoot = ref<HTMLElement | null>(null)
const { refresh: refreshReveal } = usePortalReveal(pageRoot)
const { withViewTransition } = useViewTransition()

function setViewMode(mode: 'grid' | 'list') {
  if (viewMode.value === mode) return
  withViewTransition(() => {
    viewMode.value = mode
  })
}

watch(
  () => [list.value.length, viewMode.value, pending.value, loadingMore.value],
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
      <label class="p-search-field">
        <span>{{ t('products.searchPlaceholder') }}</span>
        <div class="p-search-input-wrap">
          <input
            v-model="q"
            type="search"
            :placeholder="t('products.searchPlaceholder')"
            @input="onSearchInput"
            @search="onSearchInput"
          />
          <button
            class="p-search-submit"
            type="submit"
            :aria-label="t('common.search')"
            :disabled="pending || refreshing"
          >
            <PhCircleNotch v-if="pending" :size="18" class="p-search-spinner" />
            <PhMagnifyingGlass v-else :size="18" />
          </button>
        </div>
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
          @click="setViewMode('grid')"
        >
          ▦
        </button>
        <button
          type="button"
          :class="{ active: viewMode === 'list' }"
          @click="setViewMode('list')"
        >
          ☰
        </button>
      </div>
    </form>

    <div
      class="p-catalog-results"
      :class="{ 'is-loading': refreshing || (pending && list.length) }"
    >
      <div v-if="pending && !list.length" class="p-empty">{{ t('common.loading') }}</div>
      <VehicleEmptyState
        v-else-if="!list.length"
        variant="portal"
        :title="t('products.noResult')"
        :description="t('products.emptyDesc')"
      />
      <ProductCatalogList
        v-else
        :items="list"
        :view-mode="viewMode"
        variant="portal"
        :loading-more="loadingMore"
        :has-more="hasMore"
        :refreshing="refreshing"
        @load-more="loadMore"
      />
    </div>
  </div>
</template>
