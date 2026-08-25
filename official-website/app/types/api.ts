/** 官网 API 响应类型 */

export type ApiEnvelope<T> = {
  code: number
  data: T
  msg: string
}

export type ApiSiteSettings = {
  id: number
  siteNameZh: string
  siteNameEn: string
  logoUrl?: string | null
  faviconUrl?: string | null
  heroImageUrl?: string | null
  seoKeywordsZh?: string | null
  seoKeywordsEn?: string | null
  seoDescriptionZh?: string | null
  seoDescriptionEn?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  footerTextZh?: string | null
  footerTextEn?: string | null
  aboutTitleZh?: string | null
  aboutTitleEn?: string | null
  aboutBodyZh?: string | null
  aboutBodyEn?: string | null
  contactBodyZh?: string | null
  contactBodyEn?: string | null
}

export type ApiI18nContent = {
  name: string
  description: string
  material?: string | null
  size?: string | null
  color?: string | null
  seoTitle?: string | null
  seoKeywords?: string | null
  seoDescription?: string | null
}

export type ApiI18n = ApiI18nContent & {
  locale: string
}

export type ApiCategory = {
  id: number
  code: string
  parentId?: number | null
  nameZh: string
  nameEn: string
  sort?: number
  enabled?: boolean
  i18n?: Array<{ locale: string; name: string }>
  children?: ApiCategory[]
  parent?: ApiCategory | null
}

export type ApiMediaFile = {
  url: string
  name: string
}

export type ApiMediaAsset = ApiMediaFile & {
  size?: number | null
}

export type ApiAsset = {
  id: number
  type: 'IMAGE' | 'VIDEO' | 'PDF' | 'OTHER'
  url: string
  thumbnailUrl?: string | null
  name?: string | null
  size?: number | null
  sort?: number
}

export type ApiVehicle = {
  id: number
  code: string
  brandZh: string
  brandEn: string
  modelZh: string
  modelEn: string
  yearFrom?: number | null
  yearTo?: number | null
}

export type ApiHomeVehicle = ApiVehicle & {
  imageUrl: string
  sort?: number
}

export type ApiServiceItem = {
  id: number
  code: string
  titleZh: string
  titleEn: string
  bodyZh?: string | null
  bodyEn?: string | null
  iconUrl?: string | null
}

export type ApiPageSeo = {
  pageKey: string
  titleZh?: string | null
  titleEn?: string | null
  keywordsZh?: string | null
  keywordsEn?: string | null
  descriptionZh?: string | null
  descriptionEn?: string | null
}

export type ApiProductVehicleBind = {
  vehicleId: number
  vehicle: ApiVehicle
}

export type ApiProduct = {
  id: number
  sku: string
  slug: string
  status?: string
  sort?: number
  isNew: boolean
  isHot: boolean
  isFeatured?: boolean
  installLevel?: string | null
  categoryId?: number
  category?: ApiCategory | null
  i18n?: Record<string, ApiI18nContent>
  vehicles?: ApiVehicle[]
  cover?: ApiMediaFile | null
  promoVideo?: ApiMediaFile | null
  installVideo?: ApiMediaFile | null
  materials?: ApiMediaAsset[]
  manuals?: ApiMediaAsset[]
  assetPacks?: ApiMediaAsset[]
  hasAssetPack?: boolean
  related?: ApiProduct[]
  createdAt?: string
  updatedAt?: string
}

export type ApiProductList = {
  list: ApiProduct[]
  total: number
  page: number
  pageSize: number
}

export type ApiHomeData = {
  banners: ApiBanner[]
  hot: ApiProductList
  newer: ApiProductList
  featured?: ApiProductList
  all: ApiProductList
  homeVehicles?: ApiHomeVehicle[]
}

export type ApiBanner = {
  id: number
  titleZh: string
  titleEn: string
  imageUrl: string
  linkUrl?: string | null
  sort?: number
  enabled?: boolean
  i18n?: Array<{ locale: string; title: string }>
}

export type ApiContact = {
  id: number
  regionZh: string
  regionEn: string
  name: string
  email?: string | null
  phone?: string | null
  sort?: number
  enabled?: boolean
}

export type ProductQuery = {
  page?: number
  pageSize?: number
  category?: string
  tag?: string
  keyword?: string
  locale?: string
  vehicleId?: number
}

export type RegisterPayload = {
  email: string
  password: string
  company: string
  contactName: string
  region: string
  regionalManager: string
  address?: string
  phone?: string
}

export type LoginPayload = {
  username: string
  password: string
}

export type AuthProfile = {
  id: number
  username: string
  nickname: string
  avatar?: string | null
  email?: string | null
  company?: string | null
  contactName?: string | null
  phone?: string | null
  region?: string | null
  regionalManager?: string | null
  address?: string | null
  status?: string
  roles?: string[]
}

export type UpdateProfilePayload = {
  contactName?: string
  email?: string
  phone?: string
  address?: string
}

export type ForgotSendResult = {
  sent: boolean
  via?: string
  masked?: string
  devCode?: string
}

export type AuthLoginResult = {
  accessToken: string
  refreshToken?: string
  username: string
  nickname: string
  roles?: string[]
}

export type SharePage = {
  title?: string | null
  expiresAt?: string | null
  products: ApiProduct[]
}

export type CreateInquiryPayload = {
  company: string
  contactName: string
  email: string
  phone?: string
  region?: string
  message?: string
  items: Array<{ productId: number; quantity: number; note?: string }>
}

export type CreateMessagePayload = {
  name: string
  email: string
  company?: string
  region?: string
  content: string
}
