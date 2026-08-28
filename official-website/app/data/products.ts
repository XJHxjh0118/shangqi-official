export type ProductCategory = string

export type ProductVehicle = {
  id: number
  code: string
  brandZh: string
  brandEn: string
  modelZh: string
  modelEn: string
  yearFrom?: number | null
  yearTo?: number | null
}

export type ProductPdf = {
  url: string
  name: string
  size?: number | null
}

export type Product = {
  id: string
  sku: string
  slug: string
  category: ProductCategory
  parentCategory: string
  tags: Array<'new' | 'hot' | 'featured'>
  material: { zh: string; en: string }
  size: { zh: string; en: string }
  color: { zh: string; en: string }
  installLevel: { zh: string; en: string }
  name: { zh: string; en: string }
  description: { zh: string; en: string }
  seoTitle: { zh: string; en: string }
  seoKeywords: { zh: string; en: string }
  seoDescription: { zh: string; en: string }
  images: string[]
  previewImages: string[]
  originalImages: string[]
  video?: string
  promoVideo?: string
  installVideo?: string
  pdfs: ProductPdf[]
  vehicles: ProductVehicle[]
  assetPacks?: ProductPdf[]
  assetPackUrl?: string
  hasAssetPack?: boolean
}

export function getLocalized<T extends Record<'zh' | 'en', string>>(
  field: T,
  locale: string,
) {
  return locale === 'en' ? field.en : field.zh
}

export function vehicleLabel(vehicle: ProductVehicle, locale: string) {
  const brand = locale === 'en' ? vehicle.brandEn : vehicle.brandZh
  const model = locale === 'en' ? vehicle.modelEn : vehicle.modelZh
  const years =
    vehicle.yearFrom || vehicle.yearTo
      ? ` ${vehicle.yearFrom || ''}-${vehicle.yearTo || ''}`.replace(/-$/, '')
      : ''
  return `${brand} ${model}${years}`.trim()
}

export function vehicleSummary(
  vehicles: ProductVehicle[],
  locale: string,
  max = 2,
) {
  if (!vehicles.length) return { text: '', extra: 0 }
  const labels = vehicles.map((vehicle) => vehicleLabel(vehicle, locale))
  if (labels.length <= max) {
    return { text: labels.join(' / '), extra: 0 }
  }
  return {
    text: labels.slice(0, max).join(' / '),
    extra: labels.length - max,
  }
}
