export function requireLogin() {
  const { token } = useAuthToken()
  if (token.value) return true

  const localePath = useLocalePath()
  const route = useRoute()
  navigateTo({
    path: localePath('/login'),
    query: { redirect: route.fullPath },
  })
  return false
}
