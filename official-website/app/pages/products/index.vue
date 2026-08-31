<script setup lang="ts">
import { PhCircleNotch, PhMagnifyingGlass, PhRows, PhSquaresFour } from '@phosphor-icons/vue'
import { vehicleLabel } from '~/data/products'

const catalog = useProductsCatalog()
const {
  t,
  locale,
  localePath,
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
} = catalog

const { withViewTransition } = useViewTransition()

function setViewMode(mode: 'grid' | 'list') {
  if (viewMode.value === mode) return
  withViewTransition(() => {
    viewMode.value = mode
  })
}
</script>

<template>
  <div class="page">
    <SeoGeoItemList
      :items="
        list.map((p) => ({
          name: getLocalized(p.name, locale),
          url: localePath(`/products/${p.slug}`),
        }))
      "
    />
    <div class="container">
      <header class="page-head">
        <h1>{{ t('products.title') }}</h1>
        <p>{{ t('products.desc') }}</p>
      </header>

      <form class="catalog-bar" @submit.prevent="applyFilters">
        <div class="search-field-wrap">
          <input
            v-model="q"
            class="search-field"
            type="search"
            :placeholder="t('products.searchPlaceholder')"
            @input="onSearchInput"
            @search="onSearchInput"
          />
          <button
            class="search-submit"
            type="submit"
            :aria-label="t('common.search')"
            :disabled="pending || refreshing"
          >
            <PhCircleNotch v-if="pending" :size="18" class="search-spinner" />
            <PhMagnifyingGlass v-else :size="18" />
          </button>
        </div>
        <select
          class="select-field"
          :value="category || ''"
          @change="category = ($event.target as HTMLSelectElement).value || null; applyFilters()"
        >
          <option value="">{{ t('products.filterCategory') }}</option>
          <option v-for="c in flatCategories" :key="c.code" :value="c.code">
            {{ c.label }}
          </option>
        </select>
        <select
          class="select-field"
          :value="vehicleId || ''"
          @change="vehicleId = ($event.target as HTMLSelectElement).value || null; applyFilters()"
        >
          <option value="">{{ t('products.filterVehicle') }}</option>
          <option v-for="v in vehicles" :key="v.id" :value="String(v.id)">
            {{ vehicleLabel(v, locale) }}
          </option>
        </select>
        <div class="view-toggle" role="group" :aria-label="t('products.viewMode')">
          <el-tooltip
            :content="t('products.viewGrid')"
            placement="top"
            :show-after="200"
          >
            <button
              class="icon-btn"
              type="button"
              :aria-pressed="viewMode === 'grid'"
              :aria-label="t('products.viewGrid')"
              @click="setViewMode('grid')"
            >
              <PhSquaresFour :size="18" />
            </button>
          </el-tooltip>
          <el-tooltip
            :content="t('products.viewList')"
            placement="top"
            :show-after="200"
          >
            <button
              class="icon-btn"
              type="button"
              :aria-pressed="viewMode === 'list'"
              :aria-label="t('products.viewList')"
              @click="setViewMode('list')"
            >
              <PhRows :size="18" />
            </button>
          </el-tooltip>
        </div>
      </form>

      <div
        class="catalog-results"
        :class="{ 'is-loading': refreshing || (pending && list.length) }"
      >
        <ProductGridSkeleton v-if="pending && !list.length" />
        <ProductCatalogList
          v-else-if="list.length"
          :items="list"
          :view-mode="viewMode"
          variant="main"
          :loading-more="loadingMore"
          :has-more="hasMore"
          :refreshing="refreshing"
          @load-more="loadMore"
        />
        <VehicleEmptyState
          v-else
          :title="t('products.noResult')"
          :description="t('products.emptyDesc')"
        />
      </div>
    </div>
  </div>
</template>
