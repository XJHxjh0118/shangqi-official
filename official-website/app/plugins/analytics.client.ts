declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export default defineNuxtPlugin(() => {
  const {
    public: { gtagId },
  } = useRuntimeConfig()

  if (!gtagId || import.meta.dev) return

  useHead({
    script: [
      {
        src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gtagId)}`,
        async: true,
      },
      {
        innerHTML: [
          'window.dataLayer = window.dataLayer || [];',
          'function gtag(){dataLayer.push(arguments);}',
          "gtag('js', new Date());",
          `gtag('config', '${gtagId}');`,
        ].join('\n'),
      },
    ],
  })
})
