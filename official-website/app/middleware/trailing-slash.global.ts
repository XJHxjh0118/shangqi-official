export default defineNuxtRouteMiddleware((to) => {
  if (to.path.length > 1 && to.path.endsWith('/')) {
    const normalizedPath = to.path.replace(/\/+$/, '')
    return navigateTo(
      {
        path: normalizedPath || '/',
        query: to.query,
        hash: to.hash,
      },
      { redirectCode: 301 },
    )
  }
})
