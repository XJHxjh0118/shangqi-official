const LEGACY_KEYS = ['official-favorites-v1', 'official-inquiry-list-v1'] as const

export function useShopAccount() {
  const accountId = useState<string | null>('shop-account-id', () => null)

  function setShopAccount(id: number | string | null | undefined) {
    const next = id == null || id === '' ? null : String(id)
    if (accountId.value === next) return
    accountId.value = next
  }

  function dropLegacyShopStorage() {
    if (!import.meta.client) return
    for (const key of LEGACY_KEYS) {
      localStorage.removeItem(key)
    }
  }

  return { accountId, setShopAccount, dropLegacyShopStorage }
}

export function shopStorageKey(prefix: string, accountId: string) {
  return `${prefix}:${accountId}`
}

export function readShopList<T>(key: string): T[] {
  if (!import.meta.client) return []
  const saved = localStorage.getItem(key)
  if (!saved) return []
  try {
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeShopList<T>(key: string, items: T[]) {
  if (!import.meta.client) return
  localStorage.setItem(key, JSON.stringify(items))
}

export function removeShopList(key: string) {
  if (!import.meta.client) return
  localStorage.removeItem(key)
}
