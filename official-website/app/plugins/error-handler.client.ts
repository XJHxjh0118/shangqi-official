export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.error('[vue:error]', {
      message: error instanceof Error ? error.message : String(error),
      info,
      component: instance?.$options?.name || 'anonymous',
    })
  }

  nuxtApp.hook('app:error', (error) => {
    console.error('[app:error]', error)
  })
})
