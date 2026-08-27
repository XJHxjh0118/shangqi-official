<script setup lang="ts">
import { vehicleLabel } from '~/data/products'

definePageMeta({
  layout: 'portal',
})

const {
  t,
  locale,
  localePath,
  product,
  relatedProducts,
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

type MediaTab = 'gallery' | 'promo' | 'install' | 'pdf'
const mediaTab = ref<MediaTab>('gallery')

const hasPromo = computed(() => Boolean(product.value?.promoVideo || product.value?.video))
const hasInstall = computed(() => Boolean(product.value?.installVideo))
const hasPdf = computed(() => Boolean(product.value?.pdfs?.length))
const hasAssets = computed(
  () =>
    Boolean(product.value?.assetPacks?.length) ||
    Boolean(assetPackHref.value) ||
    hasPdf.value,
)

const promoSrc = computed(
  () => product.value?.promoVideo || product.value?.video || '',
)

watch(
  () => product.value?.slug,
  () => {
    mediaTab.value = 'gallery'
  },
)

const pageRoot = ref<HTMLElement | null>(null)
const { refresh: refreshReveal } = usePortalReveal(pageRoot)

// 客户端跳转时详情异步渲染，需在内容出现后再挂滚动渐现
watch(
  () => [product.value?.id, relatedProducts.value.length, pending.value] as const,
  async () => {
    await nextTick()
    refreshReveal()
  },
)
</script>

<template>
  <div ref="pageRoot" class="p-section">
    <NuxtLink class="p-btn-ghost" :to="localePath('/portal/products')" style="margin-bottom: 22px">
      {{ t('common.back') }}
    </NuxtLink>

    <div v-if="pending && !product" class="p-empty">{{ t('common.loading') }}</div>

    <template v-else-if="product">
      <SeoGeoProduct
        :name="name"
        :sku="product.sku"
        :description="description"
        :image="product.images[0]"
      />
      <div class="p-detail">
        <div class="p-detail-gallery">
          <img
            v-if="mediaTab === 'gallery'"
            :src="activeSrc"
            :alt="name"
          />
          <video
            v-else-if="mediaTab === 'promo' && promoSrc"
            :src="promoSrc"
            controls
            playsinline
          />
          <video
            v-else-if="mediaTab === 'install' && product.installVideo"
            :src="product.installVideo"
            controls
            playsinline
          />
          <div
            v-else-if="mediaTab === 'pdf'"
            style="padding: 24px; min-height: 320px"
          >
            <p class="p-meta" style="margin-bottom: 14px">{{ t('detail.assets') }}</p>
            <div class="p-detail-files">
              <a
                v-for="pack in product.assetPacks"
                :key="pack.url"
                :href="pack.url"
                :download="pack.name || `${product.sku}-assets.zip`"
              >
                {{ t('detail.downloadPack') }}
              </a>
              <a
                v-if="!product.assetPacks?.length && assetPackHref"
                :href="assetPackHref"
                :download="`${product.sku}-assets.zip`"
              >
                {{ t('detail.downloadPack') }}
              </a>
              <a
                v-for="pdf in product.pdfs"
                :key="pdf.url"
                :href="pdf.url"
                target="_blank"
                rel="noopener"
              >
                {{ pdf.name || t('detail.pdf') }}
              </a>
            </div>
          </div>

          <div class="p-media-thumbs" aria-label="media">
            <button
              type="button"
              :class="{ active: mediaTab === 'gallery' }"
              @click="mediaTab = 'gallery'"
            >
              {{ t('template.mediaHd') }}
            </button>
            <button
              v-if="hasPromo"
              type="button"
              :class="{ active: mediaTab === 'promo' }"
              @click="mediaTab = 'promo'"
            >
              {{ t('template.mediaPromo') }}
            </button>
            <button
              v-if="hasInstall"
              type="button"
              :class="{ active: mediaTab === 'install' }"
              @click="mediaTab = 'install'"
            >
              {{ t('template.mediaInstall') }}
            </button>
            <button
              v-if="hasAssets"
              type="button"
              :class="{ active: mediaTab === 'pdf' }"
              @click="mediaTab = 'pdf'"
            >
              {{ t('template.mediaPdf') }}
            </button>
          </div>

          <div v-if="mediaTab === 'gallery'" class="p-thumbs">
            <button
              v-for="(img, i) in product.images"
              :key="`${img}-${i}`"
              type="button"
              :class="{ active: activeImage === i }"
              @click="setActiveImage(i)"
            >
              <img :src="img" :alt="`${name} ${i + 1}`" />
            </button>
          </div>
        </div>

        <div class="p-detail-copy">
          <div class="p-eyebrow">Product Detail</div>
          <h1>{{ name }}</h1>
          <p class="p-meta">{{ product.sku }}</p>
          <p>{{ description }}</p>
          <dl class="p-spec">
            <div>
              <dt>{{ t('detail.material') }}</dt>
              <dd>{{ getLocalized(product.material, locale) }}</dd>
            </div>
            <div>
              <dt>{{ t('detail.color') }}</dt>
              <dd>{{ getLocalized(product.color, locale) }}</dd>
            </div>
            <div>
              <dt>{{ t('detail.size') }}</dt>
              <dd>{{ getLocalized(product.size, locale) }}</dd>
            </div>
            <div>
              <dt>{{ t('detail.install') }}</dt>
              <dd>{{ getLocalized(product.installLevel, locale) }}</dd>
            </div>
            <div v-if="product.vehicles.length">
              <dt>{{ t('detail.vehicles') }}</dt>
              <dd>
                {{ product.vehicles.map((v) => vehicleLabel(v, locale)).join(' / ') }}
              </dd>
            </div>
          </dl>
          <div class="p-detail-actions">
            <button class="p-btn" type="button" @click="onAddInquiry">
              {{ added ? t('detail.added') : t('detail.addInquiry') }}
            </button>
            <button class="p-btn-ghost" type="button" @click="onToggleFavorite">
              {{ favorited ? t('detail.favorited') : t('detail.favorite') }}
            </button>
            <a
              v-if="assetPackHref || product.assetPacks?.length"
              class="p-btn-ghost"
              :href="product.assetPacks?.[0]?.url || assetPackHref"
              target="_blank"
              rel="noopener"
            >
              {{ t('detail.downloadPack') }}
            </a>
          </div>
        </div>
      </div>

      <section
        v-if="relatedProducts.length"
        class="p-section"
        style="padding-left: 0; padding-right: 0"
      >
        <div class="p-section-head">
          <h2>{{ t('detail.related') }}</h2>
        </div>
        <div class="p-grid-4">
          <PortalProductCard
            v-for="item in relatedProducts.slice(0, 4)"
            :key="item.id"
            :product="item"
          />
        </div>
      </section>
    </template>
  </div>
</template>
