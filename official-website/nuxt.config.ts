// https://nuxt.com/docs/api/configuration/nuxt-config
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const siteName = process.env.NUXT_PUBLIC_SITE_NAME || 'Demo Brand Portal'
const apiBase = process.env.NUXT_PUBLIC_API_BASE || 'http://127.0.0.1:3001/car'

function resolveDevApiOrigin(base: string) {
  try {
    return new URL(String(base).replace(/\/(car|api)\/?$/i, '')).origin
  } catch {
    return 'http://127.0.0.1:3001'
  }
}

const devApiOrigin = resolveDevApiOrigin(apiBase)

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  experimental: {
    appManifest: false,
    // SWR 会抽出 _payload.json，水合时客户端拿不到数据就会重请求并把页面盖成默认内容
    payloadExtraction: false,
  },

  ssr: true,

  modules: [
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    '@nuxtjs/seo',
    '@nuxtjs/fontaine',
    '@nuxt/image',
    '@vueuse/nuxt',
    '@element-plus/nuxt',
  ],

  components: [
    {
      path: '~/components',
      ignore: ['**/portal/**'],
    },
    {
      path: '~/components/skeleton',
      pathPrefix: false,
    },
    {
      path: '~/components/portal',
      pathPrefix: false,
    },
  ],

  css: [
    '@fontsource-variable/outfit',
    '~/assets/css/main.css',
    '~/assets/css/element-theme.css',
  ],

  image: {
    quality: 80,
    format: ['webp'],
    domains: (
      process.env.NUXT_IMAGE_DOMAINS ||
      'images.unsplash.com,localhost,127.0.0.1'
    )
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean),
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
      '2xl': 1920,
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      meta: [
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#0B0D11' },
        { name: 'color-scheme', content: 'dark' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
      ],
    },
  },

  i18n: {
    locales: [
      {
        code: 'zh',
        language: 'zh-CN',
        name: '中文',
        files: [
          'zh/common.json',
          'zh/home.json',
          'zh/products.json',
          'zh/detail.json',
          'zh/inquiry.json',
          'zh/contact.json',
          'zh/about.json',
          'zh/auth.json',
          'zh/account.json',
        ],
      },
      {
        code: 'en',
        language: 'en-US',
        name: 'English',
        files: [
          'en/common.json',
          'en/home.json',
          'en/products.json',
          'en/detail.json',
          'en/inquiry.json',
          'en/contact.json',
          'en/about.json',
          'en/auth.json',
          'en/account.json',
        ],
      },
    ],
    defaultLocale: 'zh',
    strategy: 'prefix_except_default',
    langDir: 'locales',
    detectBrowserLanguage: false,
    baseUrl: siteUrl,
  },

  site: {
    url: siteUrl,
    name: siteName,
    description:
      process.env.NUXT_PUBLIC_SITE_DESCRIPTION ||
      'Product showcase portal with inquiry and contact flows for SAIC vehicle accessories.',
    defaultLocale: 'zh',
    identity: {
      type: 'Organization',
    },
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: siteName,
      url: siteUrl,
      logo: '/favicon.svg',
    },
  },

  sitemap: {
    autoLastmod: true,
  },

  robots: {
    groups: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'Google-Extended',
          'PerplexityBot',
          'ClaudeBot',
          'Applebot-Extended',
        ],
        allow: ['/', '/llms.txt'],
      },
    ],
    sitemap: '/sitemap.xml',
  },

  linkChecker: {
    enabled: false,
  },

  runtimeConfig: {
    public: {
      siteUrl,
      siteName,
      apiBase,
      apiTimeoutMs: Number(process.env.NUXT_PUBLIC_API_TIMEOUT_MS || 12000),
      gtagId: process.env.NUXT_PUBLIC_GTAG_ID || '',
    },
  },

  nitro: {
    compressPublicAssets: true,
  },

  vite: {
    // Element Plus SSR：避免 @popperjs/core CJS 命名导出报错
    ssr: {
      noExternal: ['element-plus', '@popperjs/core', '@sxzz/popperjs-es'],
    },
  },

  routeRules: {
    '/join': { redirect: { to: '/contact', statusCode: 301 } },
    '/en/join': { redirect: { to: '/en/contact', statusCode: 301 } },
    '/car/**': { proxy: `${devApiOrigin}/car/**` },
    '/uploads/**': { proxy: `${devApiOrigin}/uploads/**` },
    '/**': {
      headers: {
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'SAMEORIGIN',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'permissions-policy': 'camera=(), microphone=(), geolocation=()',
      },
    },
  },
})
