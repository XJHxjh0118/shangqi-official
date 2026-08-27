export type InquiryItem = {
  id: string
  sku: string
  name: string
  qty: number
  image?: string
  slug?: string
}

const STORAGE_PREFIX = 'official-inquiry-list-v2'

export function useInquiryList() {
  const items = useState<InquiryItem[]>('inquiry-list', () => [])
  const hydrated = useState('inquiry-list-hydrated', () => false)
  const { accountId, dropLegacyShopStorage } = useShopAccount()

  function storageKey() {
    return accountId.value ? shopStorageKey(STORAGE_PREFIX, accountId.value) : null
  }

  function persist() {
    const key = storageKey()
    if (!key) return
    writeShopList(key, items.value)
  }

  function hydrateForAccount() {
    if (!import.meta.client) return
    dropLegacyShopStorage()
    const key = storageKey()
    items.value = key ? readShopList<InquiryItem>(key) : []
  }

  // 等挂载后再读 localStorage，避免 SSR/CSR hydration 节点不一致
  onMounted(() => {
    if (hydrated.value) return
    hydrated.value = true
    hydrateForAccount()
  })

  watch(accountId, (next, prev) => {
    if (!hydrated.value) return
    if (next === prev) return
    hydrateForAccount()
  })

  function has(id: string) {
    return items.value.some((item) => item.id === id)
  }

  function addItem(item: Omit<InquiryItem, 'qty'> & { qty?: number }) {
    if (!requireLogin() || !accountId.value) return
    const existing = items.value.find((i) => i.id === item.id)
    if (existing) {
      existing.qty += item.qty || 1
    } else {
      items.value.push({ ...item, qty: item.qty || 1 })
    }
    persist()
  }

  function toggleItem(item: Omit<InquiryItem, 'qty'> & { qty?: number }) {
    if (!requireLogin() || !accountId.value) return
    if (has(item.id)) {
      items.value = items.value.filter((i) => i.id !== item.id)
      persist()
      return
    }
    addItem(item)
  }

  function updateQty(id: string, qty: number) {
    if (!requireLogin() || !accountId.value) return
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.qty = Math.max(1, qty)
      persist()
    }
  }

  function removeItem(id: string) {
    if (!requireLogin() || !accountId.value) return
    items.value = items.value.filter((i) => i.id !== id)
    persist()
  }

  function clear() {
    items.value = []
    const key = storageKey()
    if (key) removeShopList(key)
  }

  function unload() {
    items.value = []
  }

  const count = computed(() => items.value.reduce((sum, i) => i.qty + sum, 0))

  return { items, count, has, addItem, toggleItem, updateQty, removeItem, clear, unload }
}
