import { getLocalized } from '~/data/products'
import { mapApiProduct } from '~/utils/mapProduct'
import type { ApiCategory, ApiProductList } from '~/types/api'
import { useCachedAsyncData } from '~/composables/useDataCache'

const PAGE_SIZE = 24

export function useProductsCatalog(options?: { basePath?: string }) {
  const { t, locale } = useI18n()
  const route = useRoute()
  const localePath = useLocalePath()
  const router = useRouter()
  const { apiBase, getCategories, getProducts, getVehicles } = useApi()
  const basePath = options?.basePath || '/products'

  usePageSeoMeta('products', {
    title: () => t('products.seo.title'),
    description: () => t('products.seo.desc'),
  })

  const q = ref(String(route.query.q || ''))
  const category = ref<string | null>(
    route.query.category ? String(route.query.category) : null,
  )
  const vehicleId = ref<string | null>(
    route.query.vehicleId ? String(route.query.vehicleId) : null,
  )
  const viewMode = ref<'grid' | 'list'>('grid')

  const extraItems = ref<ReturnType<typeof mapApiProduct>[]>([])
  const currentPage = ref(1)
  const loadingMore = ref(false)
  /** loadMore 后服务端返回的最新 total；筛选变化时置 null，回退到首屏数据 */
  const paginationTotal = ref<number | null>(null)

  watch(
    () => route.query,
    (query) => {
      q.value = String(query.q || '')
      category.value = query.category ? String(query.category) : null
      vehicleId.value = query.vehicleId ? String(query.vehicleId) : null
    },
  )

  const categoriesAsync = useCachedAsyncData(
    'products-categories',
    () => getCategories(),
  )

  const productsKey = computed(() => {
    const query = route.query
    const keyword = query.q ? String(query.q) : ''
    const cat = query.category ? String(query.category) : ''
    const vehicle = query.vehicleId ? String(query.vehicleId) : ''
    return `products-list:${keyword}:${cat}:${vehicle}`
  })

  function buildProductQuery(page: number) {
    const query = route.query
    const keyword = query.q ? String(query.q) : undefined
    const cat = query.category ? String(query.category) : undefined
    const vehicle = query.vehicleId ? Number(query.vehicleId) : undefined
    return {
      keyword,
      category: cat && cat !== 'all' ? cat : undefined,
      vehicleId: vehicle && !Number.isNaN(vehicle) ? vehicle : undefined,
      page,
      pageSize: PAGE_SIZE,
    }
  }

  const productsAsync = useCachedAsyncData(
    () => productsKey.value,
    () => getProducts(buildProductQuery(1)),
    {
      watch: [() => route.query],
    },
  )

  const { data: categoriesRaw } = categoriesAsync
  const { data: productsRaw, pending: initialPending } = productsAsync

  const vehiclesAsync = useCachedAsyncData(
    'products-vehicles',
    () => getVehicles(),
  )

  watch(
    productsKey,
    () => {
      extraItems.value = []
      currentPage.value = 1
      paginationTotal.value = null
    },
    { flush: 'sync' },
  )

  watch(
    productsRaw,
    (data) => {
      extraItems.value = []
      currentPage.value = data?.page ?? 1
      paginationTotal.value = null
    },
    { immediate: true },
  )

  function categoryLabel(code: string, nameZh: string, nameEn: string) {
    const key = `products.categories.${code}`
    const translated = t(key)
    if (translated !== key) return translated
    return locale.value === 'en' ? nameEn : nameZh
  }

  const flatCategories = computed(() => {
    const out: Array<{ code: string; label: string }> = []
    const walk = (nodes: ApiCategory[] = []) => {
      for (const n of nodes) {
        out.push({
          code: n.code,
          label: categoryLabel(n.code, n.nameZh, n.nameEn),
        })
        if (n.children?.length) walk(n.children)
      }
    }
    walk(categoriesRaw.value || [])
    return out
  })

  const total = computed(
    () => paginationTotal.value ?? productsRaw.value?.total ?? 0,
  )

  const list = computed(() => {
    const first = (productsRaw.value?.list || []).map((p) =>
      mapApiProduct(p, apiBase),
    )
    return [...first, ...extraItems.value]
  })

  const hasMore = computed(() => {
    const count = total.value
    if (count <= 0) return false
    return list.value.length < count
  })
  const pending = computed(() => initialPending.value && !list.value.length)
  const refreshing = computed(() => initialPending.value && list.value.length > 0)

  const vehicles = computed(() => vehiclesAsync.data.value || [])

  async function loadMore() {
    if (loadingMore.value || initialPending.value || !hasMore.value) return
    loadingMore.value = true
    try {
      const nextPage = currentPage.value + 1
      const data: ApiProductList = await getProducts(buildProductQuery(nextPage))
      const mapped = (data.list || []).map((p) => mapApiProduct(p, apiBase))
      extraItems.value = [...extraItems.value, ...mapped]
      currentPage.value = data.page ?? nextPage
      paginationTotal.value = data.total ?? paginationTotal.value
    } finally {
      loadingMore.value = false
    }
  }

  function applyFilters() {
    const query: Record<string, string> = {}
    if (q.value) query.q = q.value
    if (category.value) query.category = category.value
    if (vehicleId.value) query.vehicleId = vehicleId.value
    router.push({ path: localePath(basePath), query })
  }

  function onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value
    if (!value && route.query.q) {
      applyFilters()
    }
  }

  function setCategory(code: string | null) {
    category.value = code
    applyFilters()
  }

  return {
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
    total,
    list,
    flatCategories,
    vehicles,
    applyFilters,
    onSearchInput,
    setCategory,
    loadMore,
    getLocalized,
  }
}

export const PRODUCTS_CATALOG_KEY = 'products-catalog'

export function provideProductsCatalog(
  catalog: ReturnType<typeof useProductsCatalog>,
) {
  provide(PRODUCTS_CATALOG_KEY, catalog)
}

export function useInjectedProductsCatalog() {
  const catalog = inject<ReturnType<typeof useProductsCatalog>>(
    PRODUCTS_CATALOG_KEY,
  )
  if (!catalog) {
    throw new Error('Products catalog missing')
  }
  return catalog
}
