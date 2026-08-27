export type FavoriteItem = {
  id: string
  sku: string
  slug: string
  name: string
  image?: string
}

const STORAGE_PREFIX = 'official-favorites-v2'

export function useFavorites() {
  const items = useState<FavoriteItem[]>('favorites-list', () => [])
  const hydrated = useState('favorites-hydrated', () => false)
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
    items.value = key ? readShopList<FavoriteItem>(key) : []
  }

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

  function toggle(item: FavoriteItem) {
    if (!requireLogin() || !accountId.value) return
    if (has(item.id)) {
      items.value = items.value.filter((i) => i.id !== item.id)
    } else {
      items.value.push(item)
    }
    persist()
  }

  function remove(id: string) {
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

  const count = computed(() => items.value.length)

  return { items, count, has, toggle, remove, clear, unload }
}
