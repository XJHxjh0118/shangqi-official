export default defineNuxtPlugin(() => {
  const route = useRoute()
  const { token, fetchProfile } = useAuth()
  const path = route.path
  const isAuthPage =
    path.includes('/login') ||
    path.includes('/register') ||
    path.includes('/forgot-password')
  if (!token.value || isAuthPage) return
  fetchProfile().catch(() => {})
})
