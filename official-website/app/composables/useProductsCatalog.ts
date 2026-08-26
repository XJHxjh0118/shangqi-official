import { watchDebounced } from '@vueuse/core'
import { getLocalized } from '~/data/products'
import { mapApiProduct } from '~/utils/mapProduct'
import type { ApiCategory } from '~/types/api'
import { useCachedAsyncData } from '~/composables/useDataCache'

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

  watch(
    () => route.query,
    (query) => {
      q.value = String(query.q || '')
      category.value = query.category ? String(query.category) : null
      vehicleId.value = query.vehicleId ? String(query.vehicleId) : null
    },
  )

  watchDebounced(
    q,
    () => {
      applyFilters()
    },
    { debounce: 400 },
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

  const productsAsync = useCachedAsyncData(
    () => productsKey.value,
    () => {
      const query = route.query
      const keyword = query.q ? String(query.q) : undefined
      const cat = query.category ? String(query.category) : undefined
      const vehicle = query.vehicleId ? Number(query.vehicleId) : undefined
      return getProducts({
        keyword,
        category: cat && cat !== 'all' ? cat : undefined,
        vehicleId: vehicle && !Number.isNaN(vehicle) ? vehicle : undefined,
        pageSize: 48,
      })
    },
    {
      watch: [() => route.query],
    },
  )

  const { data: categoriesRaw } = categoriesAsync
  const { data: productsRaw, pending } = productsAsync

  const vehiclesAsync = useCachedAsyncData(
    'products-vehicles',
    () => getVehicles(),
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

  const list = computed(() =>
    (productsRaw.value?.list || []).map((p) => mapApiProduct(p, apiBase)),
  )

  const vehicles = computed(() => vehiclesAsync.data.value || [])

  function applyFilters() {
    const query: Record<string, string> = {}
    if (q.value) query.q = q.value
    if (category.value) query.category = category.value
    if (vehicleId.value) query.vehicleId = vehicleId.value
    router.push({ path: localePath(basePath), query })
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
    list,
    flatCategories,
    vehicles,
    applyFilters,
    setCategory,
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
