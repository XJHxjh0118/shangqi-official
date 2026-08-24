import { getLocalized } from '~/data/products'
import { mapApiProduct } from '~/utils/mapProduct'
import { useCachedAsyncData } from '~/composables/useDataCache'

export async function useProductDetailPage() {
  const { t, locale } = useI18n()
  const route = useRoute()
  const localePath = useLocalePath()
  const { addItem } = useInquiryList()
  const { toggle, has } = useFavorites()
  const { apiBase, getProductBySlug, productAssetPackUrl } = useApi()

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
  const added = ref(false)
  const activeSrc = computed(
    () =>
      product.value?.images[activeImage.value] ||
      product.value?.images[0] ||
      '',
  )
  const favorited = computed(() =>
    product.value ? has(product.value.id) : false,
  )

  watch(slug, () => {
    activeImage.value = 0
    added.value = false
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

  const assetPackHref = computed(() => {
    if (!product.value?.hasAssetPack) return ''
    return productAssetPackUrl(product.value.slug)
  })

  function onAddInquiry() {
    const p = product.value
    if (!p) return
    addItem({
      id: p.id,
      sku: p.sku,
      name: name.value,
      image: p.images[0],
    })
    added.value = true
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
