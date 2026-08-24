import type { NuxtApp } from '#app'

/** 复用 payload / static / nuxtData 中的已缓存 asyncData */
export function getAsyncDataCached<T>(key: string): T | undefined {
  const nuxtApp = useNuxtApp()
  const fromPayload = nuxtApp.payload.data[key] as T | undefined
  if (fromPayload !== undefined) return fromPayload
  const fromStatic = nuxtApp.static.data[key] as T | undefined
  if (fromStatic !== undefined) return fromStatic
  const { data } = useNuxtData<T>(key)
  return data.value ?? undefined
}

/**
 * 水合时必须用服务端 payload，避免客户端再请求失败后把后台数据盖成空/默认值。
 * 筛选、手动刷新仍放行。
 */
export function asyncDataGetCachedData(
  key: string,
  nuxtApp: NuxtApp,
  context?: { cause?: string },
) {
  if (context?.cause === 'watch' || context?.cause === 'refresh:manual') {
    return undefined
  }
  return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
}

export function useCachedAsyncData<ResT>(
  key: string | (() => string),
  handler: () => Promise<ResT>,
  options: Parameters<typeof useAsyncData<ResT>>[2] = {},
) {
  const { getCachedData: _ignored, ...rest } = options || {}
  return useAsyncData(key, handler, {
    ...rest,
    getCachedData: (dataKey, nuxtApp, ctx) =>
      asyncDataGetCachedData(dataKey, nuxtApp, ctx),
  })
}
