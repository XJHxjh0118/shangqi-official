import { resolveMediaOrigin } from '~/utils/apiBase'

/** 将后端相对路径（如 /uploads/xxx）转为可访问的绝对 URL */
export function resolveAssetUrl(
  url: string | null | undefined,
  apiBase: string,
): string {
  if (!url || url === '#') return ''

  const origin = resolveMediaOrigin(apiBase)

  // 已是绝对地址：把同端口的 localhost 对齐到 api 主机（Windows 上避免 ::1 连错）
  if (/^(https?:|data:|blob:)/i.test(url)) {
    if (/^(data:|blob:)/i.test(url)) return url
    try {
      const abs = new URL(url)
      if (!origin) return url
      const api = new URL(origin)
      if (
        (abs.hostname === 'localhost' || abs.hostname === '127.0.0.1') &&
        (api.hostname === 'localhost' || api.hostname === '127.0.0.1') &&
        abs.port === api.port
      ) {
        abs.protocol = api.protocol
        abs.hostname = api.hostname
        return abs.toString()
      }
    } catch {
      /* keep original */
    }
    return url
  }

  const path = url.startsWith('/') ? url : `/${url}`
  return origin ? `${origin}${path}` : path
}
