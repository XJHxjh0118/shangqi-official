<script setup lang="ts">
import { PhSquaresFour, PhRows } from '@phosphor-icons/vue'
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
  list,
  flatCategories,
  vehicles,
  applyFilters,
  getLocalized,
} = catalog
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
        <input
          v-model="q"
          class="search-field"
          type="search"
          :placeholder="t('products.searchPlaceholder')"
        />
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
              @click="viewMode = 'grid'"
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
              @click="viewMode = 'list'"
            >
              <PhRows :size="18" />
            </button>
          </el-tooltip>
        </div>
      </form>

      <ProductGridSkeleton v-if="pending" />
      <div
        v-else-if="list.length && viewMode === 'grid'"
        class="product-grid"
      >
        <ProductCard v-for="p in list" :key="p.id" :product="p" />
      </div>
      <div v-else-if="list.length" class="product-list">
        <ProductCard
          v-for="p in list"
          :key="p.id"
          :product="p"
          mode="list"
        />
      </div>
      <p v-else class="empty-state">{{ t('products.noResult') }}</p>
    </div>
  </div>
</template>
