<script setup lang="ts">
import { GEO_AREAS } from '~/utils/geo'

/**
 * GEO 结构化数据（JSON-LD）。
 * 使用 Nuxt SEO 自带的 SchemaOrg* 组件，供 ChatGPT / Perplexity / Google AI 读取。
 * 本身不渲染可见 UI。
 */
const route = useRoute()
const { t } = useI18n()
const localePath = useLocalePath()
const siteConfig = useSiteConfig()
const { siteName, settings } = useSiteSettings()
const currentName = useGeoCurrentName()

const orgName = computed(() => siteName.value || t('brand.full'))
const siteUrl = computed(() => String(siteConfig.url || '').replace(/\/$/, ''))
const logo = computed(() => settings.value?.logoUrl || `${siteUrl.value}/favicon.svg`)
const contactPoint = computed(() => {
  const s = settings.value
  if (!s?.contactEmail && !s?.contactPhone) return undefined
  return [
    {
      contactType: 'customer service',
      email: s.contactEmail || undefined,
      telephone: s.contactPhone || undefined,
      areaServed: [...GEO_AREAS],
      availableLanguage: ['zh', 'en'],
    },
  ]
})

type Crumb = { name: string; item: string }

const breadcrumbs = computed<Crumb[]>(() => {
  const home: Crumb = { name: t('nav.home'), item: localePath('/') }
  const raw = route.path.replace(/^\/en(?=\/|$)/, '') || '/'
  const parts = raw.split('/').filter(Boolean)
  if (!parts.length) return [home]

  const items: Crumb[] = [home]
  const first = parts[0]
  const map: Record<string, { name: string; to: string }> = {
    products: { name: t('nav.products'), to: '/products' },
    about: { name: t('nav.about'), to: '/about' },
    join: { name: t('nav.join'), to: '/join' },
    contact: { name: t('nav.contact'), to: '/contact' },
    inquiry: { name: t('nav.inquiry'), to: '/inquiry' },
    favorites: { name: t('nav.favorites'), to: '/favorites' },
    login: { name: t('nav.account'), to: '/login' },
    register: { name: t('nav.account'), to: '/register' },
    account: { name: t('nav.account'), to: '/account' },
  }
  const hit = map[first]
  if (hit) {
    items.push({ name: hit.name, item: localePath(hit.to) })
  }
  if (first === 'products' && parts[1] && parts[1] !== 'index') {
    items.push({
      name: currentName.value || decodeURIComponent(parts[1]),
      item: localePath(`/products/${parts[1]}`),
    })
  }
  return items
})
</script>

<template>
  <SchemaOrgOrganization
    :name="orgName"
    :url="siteUrl || undefined"
    :logo="logo"
    :area-served="[...GEO_AREAS]"
    :contact-point="contactPoint"
  />
  <SchemaOrgWebSite :name="orgName" :url="siteUrl || undefined" />
  <SchemaOrgBreadcrumb :item-list-element="breadcrumbs" />
</template>
