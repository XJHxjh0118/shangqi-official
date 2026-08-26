export type FavoriteItem = {
  id: string
  sku: string
  slug: string
  name: string
  image?: string
}

const STORAGE_KEY = 'official-favorites-v1'

function readStorage(): FavoriteItem[] {
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

export function useFavorites() {
  const items = useState<FavoriteItem[]>('favorites-list', () => [])
  const hydrated = useState('favorites-hydrated', () => false)
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

  function toggle(item: FavoriteItem) {
    if (!requireLogin()) return
    if (has(item.id)) {
      items.value = items.value.filter((i) => i.id !== item.id)
    } else {
      items.value.push(item)
    }
    persist()
  }

  function remove(id: string) {
    if (!requireLogin()) return
    items.value = items.value.filter((i) => i.id !== id)
    persist()
  }

  function clear() {
    items.value = []
    clearStorage()
  }

  const count = computed(() => items.value.length)

  return { items, count, has, toggle, remove, clear }
}
