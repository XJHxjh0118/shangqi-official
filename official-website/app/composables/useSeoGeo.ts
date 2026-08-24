import type { MaybeRefOrGetter } from 'vue'

type SeoGeoOptions = {
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
  keywords?: MaybeRefOrGetter<string | undefined>
  image?: MaybeRefOrGetter<string | undefined>
}

/** 产品详情页把可读名称交给布局里的面包屑 Schema */
export function useGeoCurrentName(name?: MaybeRefOrGetter<string>) {
  const current = useState<string | null>('geo-current-name', () => null)
  if (name) {
    watch(
      () => toValue(name),
      (value) => {
        current.value = value || null
      },
      { immediate: true },
    )
    onBeforeUnmount(() => {
      current.value = null
    })
  }
  return current
}

/**
 * 页面 SEO meta（title / OG）。
 * 结构化数据 GEO 由 `<SeoGeo>` / `<SeoGeoProduct>` 组件写入。
 */
export function useSeoGeo(options: SeoGeoOptions) {
  const { locale } = useI18n()
  const siteConfig = useSiteConfig()

  const title = computed(() => toValue(options.title))
  const description = computed(() => toValue(options.description))
  const keywords = computed(() => toValue(options.keywords) || undefined)
  const image = computed(() => {
    const img = toValue(options.image)
    if (img) return img
    const base = String(siteConfig.url || '').replace(/\/$/, '')
    return base ? `${base}/og-default.svg` : '/og-default.svg'
  })

  useSeoMeta({
    title: () => title.value,
    description: () => description.value,
    keywords: () => keywords.value,
    ogTitle: () => title.value,
    ogDescription: () => description.value,
    ogType: 'website',
    ogImage: () => image.value,
    ogLocale: () => (locale.value === 'zh' ? 'zh_CN' : 'en_US'),
    twitterCard: 'summary_large_image',
    twitterTitle: () => title.value,
    twitterDescription: () => description.value,
    twitterImage: () => image.value,
  })

  useSchemaOrg([
    defineWebPage({
      name: () => title.value,
      description: () => description.value,
      inLanguage: () => (locale.value === 'zh' ? 'zh-CN' : 'en-US'),
    }),
  ])
}
