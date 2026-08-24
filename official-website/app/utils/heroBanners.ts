/**
 * 汽车场景 Banner。API 无图或数量不足时补齐。
 */
const Q = 'auto=format&fit=crop&w=2400&q=88'

export const HD_HERO_BANNERS = [
  `https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?${Q}`,
  `https://images.unsplash.com/photo-1503376780353-7e6692767b70?${Q}`,
  `https://images.unsplash.com/photo-1549317661-bd32c8ce06db?${Q}`,
  `https://images.unsplash.com/photo-1485291571150-772bcfc10da5?${Q}`,
  `https://images.unsplash.com/photo-1552519507-da3b142c6e3d?${Q}`,
] as const

export const HD_PLACEHOLDER = HD_HERO_BANNERS[0]

/** @deprecated use HD_PLACEHOLDER */
export const HD_CAR_PLACEHOLDER = HD_PLACEHOLDER

export function upgradeBannerUrl(url: string): string {
  if (!url.includes('images.unsplash.com')) return url
  try {
    const u = new URL(url)
    u.searchParams.set('auto', 'format')
    u.searchParams.set('fit', 'crop')
    u.searchParams.set('w', '2400')
    u.searchParams.set('q', '88')
    return u.toString()
  } catch {
    return url
  }
}

function isLikelyThumbnail(url: string): boolean {
  return /thumb[-_.]|_thumb\.|\/thumbs?\//i.test(url)
}

export function resolveHeroBanners(fromApi: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  for (const raw of fromApi) {
    const url = upgradeBannerUrl(raw)
    if (!url || isLikelyThumbnail(url) || seen.has(url)) continue
    seen.add(url)
    out.push(url)
  }

  return out
}
