import type { MaybeRefOrGetter } from 'vue'
import type { ApiPageSeo } from '~/types/api'
import { useCachedAsyncData } from '~/composables/useDataCache'

type PageSeoFallbacks = {
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
}

function pickLocale(
  seo: ApiPageSeo | null | undefined,
  locale: string,
  zhKey: keyof ApiPageSeo,
  enKey: keyof ApiPageSeo,
) {
  const value = locale === 'en' ? seo?.[enKey] : seo?.[zhKey]
  return typeof value === 'string' ? value.trim() : ''
}

/** 读取后台页面 SEO，并写入当前页 meta / Open Graph */
export function usePageSeoMeta(pageKey: string, fallbacks: PageSeoFallbacks) {
  const { locale } = useI18n()
  const { getPageSeo } = useApi()

  const { data: seo } = useCachedAsyncData(
    `page-seo-${pageKey}`,
    () => getPageSeo(pageKey),
  )

  const title = computed(
    () => pickLocale(seo.value, locale.value, 'titleZh', 'titleEn') || toValue(fallbacks.title),
  )
  const description = computed(
    () =>
      pickLocale(seo.value, locale.value, 'descriptionZh', 'descriptionEn') ||
      toValue(fallbacks.description),
  )
  const keywords = computed(
    () => pickLocale(seo.value, locale.value, 'keywordsZh', 'keywordsEn') || undefined,
  )

  useSeoGeo({
    title,
    description,
    keywords: () => keywords.value,
  })

  return { seo, title, description, keywords }
}
