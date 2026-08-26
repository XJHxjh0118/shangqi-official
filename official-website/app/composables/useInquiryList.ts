export type InquiryItem = {
  id: string
  sku: string
  name: string
  qty: number
  image?: string
  slug?: string
}

// v2：id 改为后端数字产品 ID（字符串形式），旧 mock 购物车作废
const STORAGE_KEY = 'official-inquiry-list-v1'

function readStorage(): InquiryItem[] {
  if (!import.meta.client) return []
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return []
  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function useInquiryList() {
  const items = useState<InquiryItem[]>('inquiry-list', () => [])
  const hydrated = useState('inquiry-list-hydrated', () => false)
  const { token } = useAuthToken()

  function persist() {
    if (!import.meta.client || !token.value) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
  }

  function hydrateIfLoggedIn() {
    if (!import.meta.client) return
    items.value = token.value ? readStorage() : []
  }

  function clearStorage() {
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // 等挂载后再读 localStorage，避免 SSR/CSR hydration 节点不一致
  onMounted(() => {
    if (hydrated.value) return
    hydrated.value = true
    hydrateIfLoggedIn()
  })

  watch(token, (next, prev) => {
    if (!hydrated.value) return
    if (next && !prev) {
      hydrateIfLoggedIn()
      return
    }
    if (!next) {
      items.value = []
      clearStorage()
    }
  })

  function has(id: string) {
    return items.value.some((item) => item.id === id)
  }

  function addItem(item: Omit<InquiryItem, 'qty'> & { qty?: number }) {
    if (!requireLogin()) return
    const existing = items.value.find((i) => i.id === item.id)
    if (existing) {
      existing.qty += item.qty || 1
    } else {
      items.value.push({ ...item, qty: item.qty || 1 })
    }
    persist()
  }

  function toggleItem(item: Omit<InquiryItem, 'qty'> & { qty?: number }) {
    if (!requireLogin()) return
    if (has(item.id)) {
      items.value = items.value.filter((i) => i.id !== item.id)
      persist()
      return
    }
    addItem(item)
  }

  function updateQty(id: string, qty: number) {
    if (!requireLogin()) return
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.qty = Math.max(1, qty)
      persist()
    }
  }

  function removeItem(id: string) {
    if (!requireLogin()) return
    items.value = items.value.filter((i) => i.id !== id)
    persist()
  }

  function clear() {
    items.value = []
    clearStorage()
  }

  const count = computed(() => items.value.reduce((sum, i) => sum + i.qty, 0))

  return { items, count, has, addItem, toggleItem, updateQty, removeItem, clear }
}
