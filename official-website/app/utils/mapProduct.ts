import type { ApiCategory, ApiI18nContent, ApiProduct } from '~/types/api'
import type { Product } from '~/data/products'
import { resolveAssetUrl } from '~/utils/media'
import { HD_PLACEHOLDER } from '~/utils/heroBanners'

const PLACEHOLDER = HD_PLACEHOLDER

function pickI18n(
  i18n: ApiProduct['i18n'],
  locale: string,
): ApiI18nContent | undefined {
  if (!i18n) return undefined
  return i18n[locale] || i18n.zh || i18n.en || Object.values(i18n)[0]
}

function fieldPair(
  i18n: ApiProduct['i18n'],
  key:
    | 'name'
    | 'description'
    | 'material'
    | 'size'
    | 'color'
    | 'seoTitle'
    | 'seoKeywords'
    | 'seoDescription',
  fallback = '—',
) {
  const zh = pickI18n(i18n, 'zh')
  const en = pickI18n(i18n, 'en')
  return {
    zh: (zh?.[key] as string | undefined | null) || fallback,
    en: (en?.[key] as string | undefined | null) || fallback,
  }
}

function resolveParentCategory(category?: ApiCategory | null): string {
  if (!category) return 'floor-mats'
  if (category.parent?.code) return category.parent.code
  return category.code
}

function mapFileList(
  items:
    | Array<{ url: string; name?: string | null; size?: number | null }>
    | undefined,
  apiBase: string,
  fallbackName: string,
) {
  return (items || [])
    .map((item) => ({
      url: resolveAssetUrl(item.url, apiBase),
      name: item.name || fallbackName,
      size: item.size ?? undefined,
    }))
    .filter((item) => item.url)
}

/** 由展示图 URL 推导缩略图（兼容旧数据） */
function displayToPreview(displayUrl: string) {
  if (!displayUrl) return ''
  if (displayUrl.includes('/disp-')) {
    return displayUrl.replace('/disp-', '/thumb-')
  }
  if (displayUrl.includes('/thumb-')) return displayUrl
  return displayUrl
}

function resolveCoverUrl(product: ApiProduct, apiBase: string): string {
  const rawCover = product.cover?.url
  if (!rawCover) return ''

  const cover = resolveAssetUrl(rawCover, apiBase)
  if (!cover) return ''

  const imageAssets = product.materials || []
  for (const asset of imageAssets) {
    const display = resolveAssetUrl(asset.url, apiBase)
    if (!display) continue
    if (cover === display) return display
  }

  // 旧数据：封面误存了缩略图地址
  if (cover.includes('/thumb-')) {
    const displayGuess = cover.replace('/thumb-', '/disp-')
    if (
      imageAssets.some(
        (a) => resolveAssetUrl(a.url, apiBase) === displayGuess,
      )
    ) {
      return displayGuess
    }
    const legacyGuess = cover.replace('/thumb-', '/')
    if (
      imageAssets.some((a) => resolveAssetUrl(a.url, apiBase) === legacyGuess)
    ) {
      return legacyGuess
    }
  }

  return cover
}

function resolveCoverPreview(
  product: ApiProduct,
  cover: string,
  apiBase: string,
): string {
  if (!cover) return ''
  const matched = (product.materials || []).find(
    (asset) => resolveAssetUrl(asset.url, apiBase) === cover,
  )
  if (matched?.thumbnailUrl) {
    return resolveAssetUrl(matched.thumbnailUrl, apiBase) || displayToPreview(cover)
  }
  return displayToPreview(cover)
}

export function mapApiProduct(product: ApiProduct, apiBase: string): Product {
  const materials = product.materials || []
  const cover = resolveCoverUrl(product, apiBase)

  const imagesFromAssets = materials
    .map((a) => resolveAssetUrl(a.url, apiBase))
    .filter(Boolean)
  const previewFromAssets = materials
    .map((a) =>
      resolveAssetUrl(a.thumbnailUrl, apiBase) ||
      displayToPreview(resolveAssetUrl(a.url, apiBase)),
    )
    .filter(Boolean)
  const originalFromAssets = materials
    .map(
      (a) =>
        resolveAssetUrl(a.originalUrl, apiBase) ||
        resolveAssetUrl(a.url, apiBase),
    )
    .filter(Boolean)

  const images: string[] = []
  const previewImages: string[] = []
  const originalImages: string[] = []

  if (cover) {
    images.push(cover)
    previewImages.push(resolveCoverPreview(product, cover, apiBase))
    const matchedIndex = imagesFromAssets.findIndex((url) => url === cover)
    originalImages.push(
      matchedIndex >= 0
        ? originalFromAssets[matchedIndex] || cover
        : cover,
    )
  }

  for (let i = 0; i < imagesFromAssets.length; i++) {
    const url = imagesFromAssets[i]
    if (url === cover) continue
    images.push(url)
    previewImages.push(previewFromAssets[i] || displayToPreview(url))
    originalImages.push(originalFromAssets[i] || url)
  }

  if (!images.length) {
    images.push(PLACEHOLDER)
    previewImages.push(PLACEHOLDER)
    originalImages.push(PLACEHOLDER)
  }

  const promoVideo =
    resolveAssetUrl(product.promoVideo?.url, apiBase) || undefined
  const installVideo =
    resolveAssetUrl(product.installVideo?.url, apiBase) || undefined
  const video = promoVideo

  const tags: Array<'new' | 'hot' | 'featured'> = []
  if (product.isNew) tags.push('new')
  if (product.isHot) tags.push('hot')
  if (product.isFeatured) tags.push('featured')

  const level = product.installLevel || '—'
  const categoryCode = product.category?.code || 'floor-mats'
  const pdfs = mapFileList(product.manuals, apiBase, 'PDF')
  const assetPacks = mapFileList(product.assetPacks, apiBase, '素材包.zip')
  const vehicles = (product.vehicles || []).filter(Boolean)

  return {
    id: String(product.id),
    sku: product.sku,
    slug: product.slug,
    category: categoryCode,
    parentCategory: resolveParentCategory(product.category),
    tags,
    material: fieldPair(product.i18n, 'material'),
    size: fieldPair(product.i18n, 'size'),
    color: fieldPair(product.i18n, 'color'),
    installLevel: { zh: level, en: level },
    name: fieldPair(product.i18n, 'name', product.sku),
    description: fieldPair(product.i18n, 'description', ''),
    seoTitle: fieldPair(product.i18n, 'seoTitle', ''),
    seoKeywords: fieldPair(product.i18n, 'seoKeywords', ''),
    seoDescription: fieldPair(product.i18n, 'seoDescription', ''),
    images,
    previewImages,
    originalImages,
    video,
    promoVideo,
    installVideo,
    pdfs,
    vehicles,
    assetPacks,
    assetPackUrl: assetPacks[0]?.url || undefined,
    hasAssetPack: Boolean(
      assetPacks.length || product.hasAssetPack || imagesFromAssets.length,
    ),
  }
}

export function flattenCategories(roots: ApiCategory[] = []) {
  const list: Array<{ code: string; nameZh: string; nameEn: string }> = []
  for (const root of roots) {
    list.push({ code: root.code, nameZh: root.nameZh, nameEn: root.nameEn })
    for (const child of root.children || []) {
      list.push({
        code: child.code,
        nameZh: child.nameZh,
        nameEn: child.nameEn,
      })
    }
  }
  return list
}
