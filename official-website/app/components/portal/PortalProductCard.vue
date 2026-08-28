<script setup lang="ts">
import type { Product } from '~/data/products'
import { getLocalized, vehicleLabel } from '~/data/products'

const props = defineProps<{
  product: Product
  listMode?: boolean
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { toggleItem, has: inInquiry } = useInquiryList()
const cardRef = ref<HTMLElement | null>(null)
usePortalCardTilt(cardRef)

const name = computed(() => getLocalized(props.product.name, locale.value))
const image = computed(
  () => props.product.previewImages[0] || props.product.images[0] || '',
)
const material = computed(() => getLocalized(props.product.material, locale.value))

const categoryLabel = computed(() => {
  const code = props.product.parentCategory || props.product.category
  const key = `products.categories.${code}`
  const translated = t(key)
  return translated !== key ? translated : code
})

const modelLabel = computed(() => {
  const first = props.product.vehicles[0]
  if (!first) return '—'
  return locale.value === 'en' ? first.modelEn || first.modelZh : first.modelZh || first.modelEn
})

const yearLabel = computed(() => {
  const first = props.product.vehicles[0]
  if (!first) return '—'
  if (first.yearFrom && first.yearTo && first.yearFrom !== first.yearTo) {
    return `${first.yearFrom}-${first.yearTo}`
  }
  return String(first.yearFrom || first.yearTo || '—')
})

const tagLabel = computed(() => {
  if (props.product.tags.includes('new')) return t('products.new')
  if (props.product.tags.includes('hot')) return t('products.hot')
  if (props.product.tags.includes('featured')) return t('products.featured')
  const v = props.product.vehicles[0]
  return v ? vehicleLabel(v, locale.value) : categoryLabel.value
})

function onInquiry(event: Event) {
  event.preventDefault()
  event.stopPropagation()
  toggleItem({
    id: props.product.id,
    sku: props.product.sku,
    name: name.value,
    image: image.value,
    slug: props.product.slug,
  })
}
</script>

<template>
  <article
    ref="cardRef"
    class="p-product-card p-reveal"
    :class="{ 'is-list': listMode }"
  >
    <div class="p-product-visual">
      <img v-if="image" :src="image" :alt="name" loading="lazy" />
    </div>
    <div class="p-product-body">
      <div class="p-meta-row">
        <span>{{ categoryLabel }}</span>
        <span>{{ modelLabel }}</span>
        <span>{{ yearLabel }}</span>
      </div>
      <h3>{{ name }}</h3>
      <div class="p-meta-row">
        <span>{{ product.sku }}</span>
        <span>{{ material }}</span>
        <span>{{ tagLabel }}</span>
      </div>
      <div class="p-card-actions">
        <button type="button" @click="onInquiry">
          {{ inInquiry(product.id) ? t('detail.added') : t('detail.addInquiry') }}
        </button>
        <NuxtLink :to="localePath(`/portal/products/${product.slug}`)">
          {{ t('template.detailBtn') }}
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
