export type FavoriteItem = {
  id: string
  sku: string
  slug: string
  name: string
  image?: string
}

const STORAGE_KEY = 'official-favorites-v1'

export function useFavorites() {
  const items = useState<FavoriteItem[]>('favorites-list', () => [])
  const hydrated = useState('favorites-hydrated', () => false)

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

  function has(id: string) {
    return items.value.some((item) => item.id === id)
  }

  function toggle(item: FavoriteItem) {
    if (has(item.id)) {
      items.value = items.value.filter((i) => i.id !== item.id)
    } else {
      items.value.push(item)
    }
    persist()
  }

  function remove(id: string) {
    items.value = items.value.filter((i) => i.id !== id)
    persist()
  }

  const count = computed(() => items.value.length)

  return { items, count, has, toggle, remove }
}
