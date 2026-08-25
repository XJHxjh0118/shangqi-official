import { useCachedAsyncData } from '~/composables/useDataCache'
import { resolveAssetUrl } from '~/utils/media'

export function useSiteSettings() {
  const { apiBase, getSiteSettings } = useApi()
  const { locale } = useI18n()

  const { data } = useCachedAsyncData('site-settings', () => getSiteSettings())

  const settings = computed(() => {
    const s = data.value
    if (!s) return null
    return {
      ...s,
      logoUrl: resolveAssetUrl(s.logoUrl, apiBase) || null,
      faviconUrl: resolveAssetUrl(s.faviconUrl, apiBase) || null,
      heroImageUrl: resolveAssetUrl(s.heroImageUrl, apiBase) || null,
    }
  })

  const siteName = computed(() => {
    const s = settings.value
    if (!s) return ''
    return locale.value === 'en' ? s.siteNameEn : s.siteNameZh
  })

  const seoDescription = computed(() => {
    const s = settings.value
    if (!s) return ''
    return locale.value === 'en' ? s.seoDescriptionEn : s.seoDescriptionZh
  })

  const seoKeywords = computed(() => {
    const s = settings.value
    if (!s) return ''
    return locale.value === 'en' ? s.seoKeywordsEn : s.seoKeywordsZh
  })

  const footerText = computed(() => {
    const s = settings.value
    if (!s) return ''
    return locale.value === 'en' ? s.footerTextEn : s.footerTextZh
  })

  const aboutTitle = computed(() => {
    const s = settings.value
    if (!s) return ''
    return locale.value === 'en' ? s.aboutTitleEn : s.aboutTitleZh
  })

  const aboutBody = computed(() => {
    const s = settings.value
    if (!s) return ''
    return locale.value === 'en' ? s.aboutBodyEn : s.aboutBodyZh
  })

  const contactBody = computed(() => {
    const s = settings.value
    if (!s) return ''
    return locale.value === 'en' ? s.contactBodyEn : s.contactBodyZh
  })

  return {
    settings,
    siteName,
    seoDescription,
    seoKeywords,
    footerText,
    aboutTitle,
    aboutBody,
    contactBody,
  }
}

export type SiteSettingsState = ReturnType<typeof useSiteSettings>
