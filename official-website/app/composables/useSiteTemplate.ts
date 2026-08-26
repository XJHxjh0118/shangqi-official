export type SiteTemplate = 'classic' | 'portal'

const TEMPLATE_COOKIE = 'ow-site-template'

const CLASSIC_TO_PORTAL: Array<[RegExp, string]> = [
  [/^\/products\/([^/?#]+)/, '/portal/products/$1'],
  [/^\/products\/?$/, '/portal/products'],
  [/^\/contact\/?$/, '/portal/contact'],
  [/^\/about\/?$/, '/portal/about'],
  [/^\/inquiry\/?$/, '/portal/inquiry'],
  [/^\/favorites\/?$/, '/portal/favorites'],
  [/^\/?$/, '/portal'],
]

const PORTAL_TO_CLASSIC: Array<[RegExp, string]> = [
  [/^\/portal\/products\/([^/?#]+)/, '/products/$1'],
  [/^\/portal\/products\/?$/, '/products'],
  [/^\/portal\/contact\/?$/, '/contact'],
  [/^\/portal\/about\/?$/, '/about'],
  [/^\/portal\/inquiry\/?$/, '/inquiry'],
  [/^\/portal\/favorites\/?$/, '/favorites'],
  [/^\/portal\/?$/, '/'],
]

function stripLocalePrefix(path: string) {
  return path.replace(/^\/(zh|en)(?=\/|$)/, '') || '/'
}

function withLocalePrefix(localePath: string, mapped: string) {
  const match = localePath.match(/^\/(zh|en)(?=\/|$)/)
  if (!match) return mapped
  if (mapped === '/') return `/${match[1]}`
  return `/${match[1]}${mapped}`
}

function remapPath(path: string, rules: Array<[RegExp, string]>) {
  const bare = stripLocalePrefix(path)
  for (const [pattern, target] of rules) {
    if (pattern.test(bare)) {
      return withLocalePrefix(path, bare.replace(pattern, target))
    }
  }
  return null
}

export function useSiteTemplate() {
  const cookie = useCookie<SiteTemplate>(TEMPLATE_COOKIE, {
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    default: () => 'classic',
  })
  const template = useState<SiteTemplate>(
    'site-template',
    () => cookie.value || 'classic',
  )
  const route = useRoute()
  const localePath = useLocalePath()

  const isPortalRoute = computed(() =>
    stripLocalePrefix(route.path).startsWith('/portal'),
  )

  watch(
    isPortalRoute,
    (portal) => {
      const next: SiteTemplate = portal ? 'portal' : 'classic'
      if (template.value !== next) template.value = next
      if (cookie.value !== next) cookie.value = next
    },
    { immediate: true },
  )

  function counterpartPath(target: SiteTemplate, fromPath = route.fullPath) {
    const [rawPath = '/', search = ''] = fromPath.split('?')
    const hashIndex = rawPath.indexOf('#')
    const pathOnly = hashIndex >= 0 ? rawPath.slice(0, hashIndex) : rawPath
    const hash = hashIndex >= 0 ? rawPath.slice(hashIndex) : ''
    const queryAndHash = (search ? `?${search}` : '') + hash

    if (target === 'portal') {
      const mapped = remapPath(pathOnly, CLASSIC_TO_PORTAL)
      if (mapped) return mapped + queryAndHash
      return localePath('/portal') + queryAndHash
    }

    const mapped = remapPath(pathOnly, PORTAL_TO_CLASSIC)
    if (mapped) return mapped + queryAndHash
    return localePath('/') + queryAndHash
  }

  async function setTemplate(next: SiteTemplate) {
    if (template.value === next && isPortalRoute.value === (next === 'portal')) {
      return
    }
    template.value = next
    cookie.value = next
    const to = counterpartPath(next)
    if (to !== route.fullPath) {
      await navigateTo(to)
    }
  }

  async function toggleTemplate() {
    await setTemplate(template.value === 'portal' ? 'classic' : 'portal')
  }

  return {
    template,
    isPortalRoute,
    setTemplate,
    toggleTemplate,
    counterpartPath,
  }
}
