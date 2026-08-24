export type InquiryItem = {
  id: string
  sku: string
  name: string
  qty: number
  image?: string
}

// v2：id 改为后端数字产品 ID（字符串形式），旧 mock 购物车作废
const STORAGE_KEY = 'official-inquiry-list-v1'

export function useInquiryList() {
  const items = useState<InquiryItem[]>('inquiry-list', () => [])
  const hydrated = useState('inquiry-list-hydrated', () => false)

  // 等挂载后再读 localStorage，避免 SSR/CSR hydration 节点不一致
  onMounted(() => {
    if (hydrated.value) return
    hydrated.value = true
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    try {
      items.value = JSON.parse(saved)
    } catch {
      items.value = []
    }
  })

  function persist() {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
    }
  }

  function addItem(item: Omit<InquiryItem, 'qty'> & { qty?: number }) {
    const existing = items.value.find((i) => i.id === item.id)
    if (existing) {
      existing.qty += item.qty || 1
    } else {
      items.value.push({ ...item, qty: item.qty || 1 })
    }
    persist()
  }

  function updateQty(id: string, qty: number) {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.qty = Math.max(1, qty)
      persist()
    }
  }

  function removeItem(id: string) {
    items.value = items.value.filter((i) => i.id !== id)
    persist()
  }

  function clear() {
    items.value = []
    persist()
  }

  const count = computed(() => items.value.reduce((sum, i) => sum + i.qty, 0))

  return { items, count, addItem, updateQty, removeItem, clear }
}
