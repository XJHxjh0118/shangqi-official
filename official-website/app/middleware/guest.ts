export default defineNuxtRouteMiddleware(() => {
  const { token } = useAuthToken()
  if (!token.value) return
  const localePath = useLocalePath()
  return navigateTo(localePath('/account'))
})
