<script setup lang="ts">
import { PhCaretLeft, PhCaretRight } from '@phosphor-icons/vue'
import { vehicleLabel } from '~/data/products'

const {
  t,
  locale,
  localePath,
  product,
  relatedProducts,
  prevProduct,
  nextProduct,
  name,
  description,
  activeImage,
  activeSrc,
  added,
  favorited,
  pending,
  assetPackHref,
  onAddInquiry,
  onToggleFavorite,
  setActiveImage,
  getLocalized,
} = await useProductDetailPage()

function neighborName(item: NonNullable<typeof prevProduct.value>) {
  return getLocalized(item.name, locale.value)
}

function onKeydown(e: KeyboardEvent) {
  const target = e.target
  if (target instanceof HTMLElement && target.closest('input, textarea, select')) {
    return
  }
  if (e.key === 'ArrowLeft' && prevProduct.value) {
    navigateTo(localePath(`/products/${prevProduct.value.slug}`))
  }
  if (e.key === 'ArrowRight' && nextProduct.value) {
    navigateTo(localePath(`/products/${nextProduct.value.slug}`))
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="page">
    <div class="container">
      <NuxtLink class="back-link" :to="localePath('/products')">
        {{ t('common.back') }}
      </NuxtLink>

      <ProductDetailSkeleton v-if="pending && !product" />

      <template v-else-if="product">
        <SeoGeoProduct
          :name="name"
          :sku="product.sku"
          :description="description"
          :image="product.images[0]"
        />
        <div class="detail-grid">
          <div>
            <div class="gallery-main">
              <img :src="activeSrc" :alt="name" />
              <ProductFlags :tags="product.tags" />
            </div>
            <div class="thumbs">
              <button
                v-for="(img, i) in product.images"
                :key="`${img}-${i}`"
                type="button"
                :class="{ 'is-active': activeImage === i }"
                @click="setActiveImage(i)"
              >
                <img :src="img" :alt="`${name} ${i + 1}`" />
              </button>
            </div>
            <section
              v-if="product.promoVideo || product.installVideo"
              class="detail-videos"
            >
              <article v-if="product.promoVideo">
                <h2>{{ t('detail.promoVideo') }}</h2>
                <div class="gallery-main">
                  <video :src="product.promoVideo" controls playsinline />
                </div>
              </article>
              <article v-if="product.installVideo">
                <h2>{{ t('detail.installVideo') }}</h2>
                <div class="gallery-main">
                  <video :src="product.installVideo" controls playsinline />
                </div>
              </article>
            </section>
          </div>

          <div>
            <p class="product-meta">{{ t('products.sku') }} {{ product.sku }}</p>
            <h1 class="page-head" style="padding: 8px 0 12px">{{ name }}</h1>
            <p>{{ description }}</p>

            <p v-if="product.vehicles.length" class="product-meta" style="margin-top: 16px">
              {{ t('detail.vehicles') }}:
              {{ product.vehicles.map((v) => vehicleLabel(v, locale)).join(', ') }}
            </p>

            <div class="spec-grid">
              <div class="spec-cell">
                <span>{{ t('detail.size') }}</span>
                <strong>{{ getLocalized(product.size, locale) }}</strong>
              </div>
              <div class="spec-cell">
                <span>{{ t('detail.material') }}</span>
                <strong>{{ getLocalized(product.material, locale) }}</strong>
              </div>
              <div class="spec-cell">
                <span>{{ t('detail.color') }}</span>
                <strong>{{ getLocalized(product.color, locale) }}</strong>
              </div>
              <div class="spec-cell">
                <span>{{ t('detail.install') }}</span>
                <strong>{{ getLocalized(product.installLevel, locale) }}</strong>
              </div>
            </div>

            <div class="detail-actions">
              <button
                class="btn btn-primary"
                type="button"
                :aria-pressed="added"
                @click="onAddInquiry"
              >
                {{ added ? t('detail.added') : t('detail.addInquiry') }}
              </button>
              <button class="btn btn-ghost" type="button" @click="onToggleFavorite">
                {{ favorited ? t('detail.favorited') : t('detail.favorite') }}
              </button>
            </div>

            <div
              v-if="product.assetPacks?.length || assetPackHref || product.pdfs.length"
              class="detail-files"
            >
              <p class="product-meta">{{ t('detail.assets') }}</p>
              <div class="detail-files-row">
                <a
                  v-for="pack in product.assetPacks"
                  :key="pack.url"
                  class="btn btn-ghost"
                  :href="pack.url"
                  :download="pack.name || `${product.sku}-assets.zip`"
                >
                  {{ t('detail.downloadPack') }}
                </a>
                <a
                  v-if="!product.assetPacks?.length && assetPackHref"
                  class="btn btn-ghost"
                  :href="assetPackHref"
                  :download="`${product.sku}-assets.zip`"
                >
                  {{ t('detail.downloadPack') }}
                </a>
                <a
                  v-for="pdf in product.pdfs"
                  :key="pdf.url"
                  class="btn btn-ghost"
                  :href="pdf.url"
                  target="_blank"
                  rel="noopener"
                >
                  {{ t('detail.pdf') }}
                </a>
              </div>
            </div>
          </div>
        </div>

        <section v-if="relatedProducts.length" class="detail-related">
          <h2 class="section-title">{{ t('detail.related') }}</h2>
          <div class="product-grid">
            <ProductCard v-for="p in relatedProducts" :key="p.id" :product="p" />
          </div>
        </section>
      </template>
    </div>

    <NuxtLink
      v-if="prevProduct"
      class="detail-pager detail-pager-prev"
      :to="localePath(`/products/${prevProduct.slug}`)"
      :aria-label="t('detail.prev', { name: neighborName(prevProduct) })"
      prefetch
    >
      <PhCaretLeft :size="22" weight="regular" />
    </NuxtLink>
    <NuxtLink
      v-if="nextProduct"
      class="detail-pager detail-pager-next"
      :to="localePath(`/products/${nextProduct.slug}`)"
      :aria-label="t('detail.next', { name: neighborName(nextProduct) })"
      prefetch
    >
      <PhCaretRight :size="22" weight="regular" />
    </NuxtLink>
  </div>
</template>
