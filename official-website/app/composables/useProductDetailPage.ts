import { getLocalized } from '~/data/products'
import { mapApiProduct } from '~/utils/mapProduct'
import { useCachedAsyncData } from '~/composables/useDataCache'

export async function useProductDetailPage() {
  const { t, locale } = useI18n()
  const route = useRoute()
  const localePath = useLocalePath()
  const { toggleItem, has: inInquiry } = useInquiryList()
  const { toggle, has } = useFavorites()
  const { apiBase, getProductBySlug, getProducts, downloadProductAssetPack } = useApi()

  const slug = computed(() => String(route.params.slug))

  const productAsync = useCachedAsyncData(
    () => `product-${slug.value}`,
    () => getProductBySlug(slug.value),
    {
      watch: [slug],
    },
  )

  const { data: raw, error, pending } = productAsync

  const product = computed(() => {
    if (!raw.value || raw.value.slug !== slug.value) return null
    return mapApiProduct(raw.value, apiBase)
  })
  const related = computed(() => {
    if (!raw.value || raw.value.slug !== slug.value) return []
    return (raw.value.related || []).map((p) => mapApiProduct(p, apiBase))
  })

  const catalogAsync = useCachedAsyncData(
    'product-detail-nav',
    () => getProducts({ pageSize: 100 }),
  )

  const catalogProducts = computed(() =>
    (catalogAsync.data.value?.list || []).map((p) => mapApiProduct(p, apiBase)),
  )

  const currentIndex = computed(() =>
    catalogProducts.value.findIndex((item) => item.slug === slug.value),
  )

  const prevProduct = computed(() => {
    const list = catalogProducts.value
    const index = currentIndex.value
    if (list.length < 2 || index < 0) return null
    return list[(index - 1 + list.length) % list.length]
  })

  const nextProduct = computed(() => {
    const list = catalogProducts.value
    const index = currentIndex.value
    if (list.length < 2 || index < 0) return null
    return list[(index + 1) % list.length]
  })

  const relatedProducts = computed(() => {
    if (related.value.length) return related.value
    const current = product.value
    const others = catalogProducts.value.filter((item) => item.slug !== slug.value)
    if (!current) return others.slice(0, 6)
    const sameCategory = others.filter((item) => item.category === current.category)
    return (sameCategory.length ? sameCategory : others).slice(0, 6)
  })

  const name = computed(() =>
    product.value ? getLocalized(product.value.name, locale.value) : '',
  )
  const description = computed(() =>
    product.value ? getLocalized(product.value.description, locale.value) : '',
  )
  const seoTitle = computed(() => {
    if (!product.value) return ''
    return (
      getLocalized(product.value.seoTitle, locale.value) ||
      `${name.value} | ${t('brand.full')}`
    )
  })
  const seoDescription = computed(() => {
    if (!product.value) return ''
    return (
      getLocalized(product.value.seoDescription, locale.value) ||
      description.value
    )
  })
  const seoKeywords = computed(() =>
    product.value
      ? getLocalized(product.value.seoKeywords, locale.value)
      : '',
  )
  const activeImage = ref(0)
  const added = computed(() =>
    product.value ? inInquiry(product.value.id) : false,
  )
  const activeSrc = computed(
    () =>
      product.value?.images[activeImage.value] ||
      product.value?.images[0] ||
      '',
  )
  const activePreviewSrc = computed(
    () =>
      product.value?.previewImages[activeImage.value] ||
      product.value?.previewImages[0] ||
      activeSrc.value,
  )
  const activeOriginalSrc = computed(
    () =>
      product.value?.originalImages[activeImage.value] ||
      product.value?.originalImages[0] ||
      '',
  )
  const canDownloadOriginal = computed(() => {
    const original = activeOriginalSrc.value
    const display = activeSrc.value
    return Boolean(original && display && original !== display)
  })
  const favorited = computed(() =>
    product.value ? has(product.value.id) : false,
  )

  watch(slug, () => {
    activeImage.value = 0
    if (import.meta.client) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  })

  watch([error, raw, pending, slug], () => {
    if (
      import.meta.client &&
      !pending.value &&
      (error.value || !raw.value || raw.value.slug !== slug.value)
    ) {
      throw createError({ statusCode: 404, statusMessage: 'Product not found' })
    }
  })

  useSeoGeo({
    title: () => seoTitle.value,
    description: () => seoDescription.value,
    keywords: () => seoKeywords.value || undefined,
    image: () => product.value?.images[0],
  })

  const hasLegacyAssetPack = computed(() => Boolean(product.value?.hasAssetPack))

  async function onDownloadAssetPack() {
    const p = product.value
    if (!p?.hasAssetPack) return
    await downloadProductAssetPack(p.slug, `${p.sku}-assets.zip`)
  }

  function onAddInquiry() {
    const p = product.value
    if (!p) return
    toggleItem({
      id: p.id,
      sku: p.sku,
      name: name.value,
      image: p.images[0],
      slug: p.slug,
    })
  }

  function onToggleFavorite() {
    const p = product.value
    if (!p) return
    toggle({
      id: p.id,
      sku: p.sku,
      slug: p.slug,
      name: name.value,
      image: p.images[0],
    })
  }

  function setActiveImage(i: number) {
    activeImage.value = i
  }

  if (import.meta.server) {
    await productAsync
    if (
      error.value ||
      !raw.value ||
      raw.value.slug !== slug.value
    ) {
      throw createError({ statusCode: 404, statusMessage: 'Product not found' })
    }
  }

  return {
    t,
    locale,
    localePath,
    slug,
    product,
    related,
    relatedProducts,
    prevProduct,
    nextProduct,
    name,
    description,
    activeImage,
    activeSrc,
    activePreviewSrc,
    activeOriginalSrc,
    canDownloadOriginal,
    added,
    favorited,
    pending,
    hasLegacyAssetPack,
    onDownloadAssetPack,
    onAddInquiry,
    onToggleFavorite,
    setActiveImage,
    getLocalized,
  }
}

export const PRODUCT_DETAIL_KEY = 'product-detail'

export function provideProductDetailPage(
  detail: ReturnType<typeof useProductDetailPage>,
) {
  provide(PRODUCT_DETAIL_KEY, detail)
}

export function useInjectedProductDetailPage() {
  const detail = inject<ReturnType<typeof useProductDetailPage>>(
    PRODUCT_DETAIL_KEY,
  )
  if (!detail) {
    throw new Error('Product detail missing')
  }
  return detail
}
