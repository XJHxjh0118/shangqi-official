/** 站点全局 head：favicon 等 */
export function useSiteHead() {
  const { settings, siteName } = useSiteSettings()

  useHead({
    titleTemplate: (title?: string) => {
      const name = siteName.value
      if (!title) return name || ''
      return name ? `${title} | ${name}` : title
    },
    link: computed(() => {
      const favicon = settings.value?.faviconUrl
      if (!favicon) return []
      return [{ rel: 'icon' as const, href: favicon }]
    }),
  })
}
