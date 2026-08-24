/** 官网对接后端：全局前缀 `/car`，上传资源在站点根 `/uploads`（不在 /car 下） */

export const API_PREFIX = '/car'

export function normalizeApiBase(raw: string | undefined | null): string {
  const trimmed = String(raw || '').trim().replace(/\/+$/, '')
  if (!trimmed || trimmed === '/' || trimmed === '/api') return API_PREFIX

  try {
    const url = new URL(trimmed)
    const path = url.pathname.replace(/\/+$/, '') || '/'
    if (path === '/' || path === '/api' || path === API_PREFIX) {
      return `${url.origin}${API_PREFIX}`
    }
    return `${url.origin}${path}`
  } catch {
    if (trimmed === '/api' || trimmed.startsWith('/api/')) {
      return trimmed.replace(/^\/api/, API_PREFIX)
    }
    return trimmed
  }
}

/** 静态资源 origin：`http://host:3001/car` → `http://host:3001`；相对 `/car` → 空（走当前站点） */
export function resolveMediaOrigin(apiBase: string): string {
  const base = normalizeApiBase(apiBase)
  try {
    return new URL(base).origin
  } catch {
    return ''
  }
}

/**
 * 浏览器请求基址。
 * 开发时页面在 localhost:3000，直连 127.0.0.1:3001 会被拦或 CORS 失败；
 * 改走同域 `/car`，由 Nuxt 代理到 Nest。服务端仍直连绝对地址，避免自己代理自己。
 */
export function resolveRequestBase(apiBase: string, isServer: boolean): string {
  const base = normalizeApiBase(apiBase)
  if (isServer) return base
  try {
    const url = new URL(base)
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      return url.pathname.replace(/\/+$/, '') || API_PREFIX
    }
    return base
  } catch {
    return base || API_PREFIX
  }
}
