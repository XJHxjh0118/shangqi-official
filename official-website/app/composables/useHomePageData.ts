import { mapApiProduct } from '~/utils/mapProduct'
import { resolveAssetUrl } from '~/utils/media'
import { resolveHeroBanners } from '~/utils/heroBanners'
import { useCachedAsyncData } from '~/composables/useDataCache'
import type { ApiBanner, ApiHomeVehicle } from '~/types/api'

export type HeroSlide = {
  image: string
  title: string
  linkUrl?: string
}

export function useHomePageData() {
  const { t, locale } = useI18n()
  const { apiBase, getHome, getServices } = useApi()
  const { settings, seoDescription } = useSiteSettings()

  usePageSeoMeta('home', {
    title: () =>
      (locale.value === 'en'
        ? settings.value?.siteNameEn
        : settings.value?.siteNameZh) || t('home.seo.title'),
    description: () => seoDescription.value || t('home.seo.desc'),
  })

  const { data: homeRaw, pending } = useCachedAsyncData(
    'home-data',
    () => getHome(),
  )

  const { data: servicesRaw } = useCachedAsyncData(
    'home-services',
    () => getServices(),
  )

  function bannerTitle(b: ApiBanner) {
    const fromI18n = b.i18n?.find((item) => item.locale === locale.value)?.title
    if (fromI18n) return fromI18n
    return locale.value === 'en' ? b.titleEn : b.titleZh
  }

  const heroSlides = computed<HeroSlide[]>(() => {
    const seen = new Set<string>()
    const slides: HeroSlide[] = []

    for (const b of homeRaw.value?.banners || []) {
      const raw = resolveAssetUrl(b.imageUrl, apiBase)
      if (!raw) continue
      const image = resolveHeroBanners([raw])[0]
      if (!image || seen.has(image)) continue
      seen.add(image)
      slides.push({
        image,
        title: bannerTitle(b).trim() || t('home.heroTitle'),
        linkUrl: b.linkUrl || undefined,
      })
    }

    return slides
  })

  function mapList(raw?: { list?: unknown[] } | null) {
    return (raw?.list || []).map((p) => mapApiProduct(p as never, apiBase))
  }

  const allProducts = computed(() => mapList(homeRaw.value?.all))
  const featuredProducts = computed(() => {
    const featured = mapList(homeRaw.value?.featured)
    return featured.length ? featured : allProducts.value.slice(0, 3)
  })
  const hotProducts = computed(() => {
    const hot = mapList(homeRaw.value?.hot)
    return hot.length ? hot : allProducts.value.slice(0, 4)
  })
  const newProducts = computed(() => {
    const newer = mapList(homeRaw.value?.newer)
    return newer.length ? newer : allProducts.value.slice(0, 8)
  })

  const services = computed(() =>
    (servicesRaw.value || []).map((s) => ({
      id: s.id,
      title: locale.value === 'en' ? s.titleEn : s.titleZh,
      body: locale.value === 'en' ? s.bodyEn || '' : s.bodyZh || '',
    })),
  )

  const homeVehicles = computed<ApiHomeVehicle[]>(() =>
    (homeRaw.value?.homeVehicles || [])
      .map((item) => ({
        ...item,
        imageUrl: resolveAssetUrl(item.imageUrl, apiBase),
      }))
      .filter((item) => item.id && item.imageUrl),
  )

  return {
    heroSlides,
    featuredProducts,
    hotProducts,
    newProducts,
    services,
    homeVehicles,
    pending,
  }
}
