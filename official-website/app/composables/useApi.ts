import type {
  ApiBanner,
  ApiCategory,
  ApiContact,
  ApiEnvelope,
  ApiHomeData,
  ApiHomeVehicle,
  ApiPageSeo,
  ApiProduct,
  ApiProductList,
  ApiServiceItem,
  ApiSiteSettings,
  ApiVehicle,
  AuthLoginResult,
  AuthProfile,
  CreateInquiryPayload,
  CreateMessagePayload,
  LoginPayload,
  MyInquiryList,
  ProductQuery,
  RegisterPayload,
  SharePage,
  UpdateProfilePayload,
  ForgotSendResult,
} from '~/types/api'
import { normalizeApiBase, resolveRequestBase } from '~/utils/apiBase'

/** 与 Nest `setGlobalPrefix('car')` + PublicController / AuthController 对齐 */
const paths = {
  siteSettings: '/public/site-settings',
  home: '/public/home',
  banners: '/public/banner/list',
  categories: '/public/category/list',
  contacts: '/public/contact/list',
  vehicles: '/public/vehicle/list',
  homeVehicles: '/public/home-vehicle/list',
  services: '/public/service/list',
  seo: '/public/seo',
  share: (token: string) => `/public/share/${encodeURIComponent(token)}`,
  products: '/public/product/list',
  productDetail: (slug: string) =>
    `/public/product/detail/${encodeURIComponent(slug)}`,
  assetPack: (slug: string) =>
    `/public/product/asset-pack/${encodeURIComponent(slug)}`,
  inquiry: '/public/inquiry/add',
  message: '/public/message/add',
  login: '/auth/login',
  register: '/auth/register',
  profile: '/auth/profile',
  forgotSend: '/auth/forgot/send-code',
  forgotReset: '/auth/forgot/reset',
  changePassword: '/auth/change-password',
  myInquiries: '/auth/inquiries',
} as const

export function useApi() {
  const config = useRuntimeConfig()
  const apiBase = normalizeApiBase(String(config.public.apiBase || ''))
  const requestBase = resolveRequestBase(apiBase, import.meta.server)
  const apiTimeout = Number(config.public.apiTimeoutMs || 12000)
  const { token } = useAuthToken()

  async function apiFetch<T>(
    path: string,
    opts?: Parameters<typeof $fetch>[1] & { accessToken?: string | null },
  ): Promise<T> {
    try {
      const method = String(opts?.method || 'POST').toUpperCase()
      const { accessToken, ...fetchOpts } = opts || {}
      const authToken = accessToken || token.value

      const res = await $fetch<ApiEnvelope<T> | T>(`${requestBase}${path}`, {
        timeout: apiTimeout,
        retry: 0,
        ...fetchOpts,
        method,
        onRequest(ctx) {
          if (typeof fetchOpts.onRequest === 'function') {
            fetchOpts.onRequest(ctx)
          }
          const headers = new Headers(ctx.options.headers)
          if (authToken) {
            headers.set('Authorization', `Bearer ${authToken}`)
          }
          ctx.options.headers = headers
        },
      })
      if (res && typeof res === 'object' && 'code' in res && 'data' in res) {
        const envelope = res as ApiEnvelope<T>
        if (envelope.code !== 200) {
          throw createError({
            statusCode: envelope.code || 502,
            statusMessage: envelope.msg || '请求失败',
          })
        }
        return envelope.data
      }
      return res as T
    } catch (error) {
      const typed = error as {
        data?: { code?: number; msg?: string; message?: string }
        statusCode?: number
        statusMessage?: string
      }
      const msg = typed?.data?.msg || typed?.data?.message
      if (msg) {
        throw createError({
          statusCode: typed.data?.code || typed.statusCode || 502,
          statusMessage: Array.isArray(msg) ? msg.join('；') : String(msg),
        })
      }
      console.error('[api:error]', {
        path,
        method: opts?.method || 'POST',
        error,
      })
      throw error
    }
  }

  async function downloadAssetPack(slug: string, filename?: string) {
    const authToken = token.value
    const blob = await $fetch<Blob>(`${requestBase}${paths.assetPack(slug)}`, {
      method: 'POST',
      responseType: 'blob',
      timeout: apiTimeout,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename || `${slug}-asset-pack.zip`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return {
    apiBase,

    getSiteSettings: () => apiFetch<ApiSiteSettings>(paths.siteSettings),

    getHome: () => apiFetch<ApiHomeData>(paths.home),

    getBanners: () => apiFetch<ApiBanner[]>(paths.banners),

    getCategories: () => apiFetch<ApiCategory[]>(paths.categories),

    getContacts: () => apiFetch<ApiContact[]>(paths.contacts),

    getVehicles: () => apiFetch<ApiVehicle[]>(paths.vehicles),

    getHomeVehicles: () => apiFetch<ApiHomeVehicle[]>(paths.homeVehicles),

    getServices: () => apiFetch<ApiServiceItem[]>(paths.services),

    getPageSeo: (pageKey: string) =>
      apiFetch<ApiPageSeo>(paths.seo, { body: { pageKey } }),

    getShare: (shareToken: string) =>
      apiFetch<SharePage>(paths.share(shareToken)),

    getProducts: (query: ProductQuery = {}) =>
      apiFetch<ApiProductList>(paths.products, { body: query }),

    getProductBySlug: (slug: string) =>
      apiFetch<ApiProduct>(paths.productDetail(slug)),

    downloadProductAssetPack: downloadAssetPack,

    createInquiry: (body: CreateInquiryPayload) =>
      apiFetch(paths.inquiry, { method: 'POST', body }),

    createMessage: (body: CreateMessagePayload) =>
      apiFetch(paths.message, { method: 'POST', body }),

    login: (body: LoginPayload) =>
      apiFetch<AuthLoginResult>(paths.login, { method: 'POST', body }),

    register: (body: RegisterPayload) =>
      apiFetch(paths.register, { method: 'POST', body }),

    sendResetCode: (account: string) =>
      apiFetch<ForgotSendResult>(paths.forgotSend, {
        method: 'POST',
        body: { account },
      }),

    resetPassword: (body: { account: string; code: string; password: string }) =>
      apiFetch(paths.forgotReset, { method: 'POST', body }),

    getProfile: (accessToken?: string | null) =>
      apiFetch<AuthProfile>(paths.profile, { accessToken }),

    updateProfile: (body: UpdateProfilePayload) =>
      apiFetch<AuthProfile>(paths.profile, { method: 'PATCH', body }),

    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      apiFetch(paths.changePassword, { method: 'POST', body }),

    getMyInquiries: (
      query: {
        page?: number
        pageSize?: number
        status?: string
        keyword?: string
      } = {},
    ) => apiFetch<MyInquiryList>(paths.myInquiries, { body: query }),
  }
}
