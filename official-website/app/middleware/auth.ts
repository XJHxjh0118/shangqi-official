export default defineNuxtRouteMiddleware((to) => {
  const { token } = useAuthToken()
  if (token.value) return
  const localePath = useLocalePath()
  return navigateTo({
    path: localePath('/login'),
    query: { redirect: to.fullPath },
  })
})
