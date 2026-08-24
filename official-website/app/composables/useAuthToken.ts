const TOKEN_COOKIE = 'ow-token'
const REFRESH_COOKIE = 'ow-refresh'

function cleanToken(value: string | null | undefined) {
  if (!value) return null
  const trimmed = String(value).trim().replace(/^Bearer\s+/i, '')
  const unquoted = trimmed.replace(/^"/, '').replace(/"$/, '')
  return unquoted || null
}

export function useAuthToken() {
  const tokenCookie = useCookie<string | null>(TOKEN_COOKIE, {
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    default: () => null,
  })
  const refreshCookie = useCookie<string | null>(REFRESH_COOKIE, {
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    default: () => null,
  })

  const token = useState<string | null>(
    'ow-access-token',
    () => cleanToken(tokenCookie.value),
  )
  const refreshToken = useState<string | null>(
    'ow-refresh-token',
    () => cleanToken(refreshCookie.value),
  )

  if (!token.value && tokenCookie.value) {
    token.value = cleanToken(tokenCookie.value)
  }
  if (!refreshToken.value && refreshCookie.value) {
    refreshToken.value = cleanToken(refreshCookie.value)
  }

  function setTokens(access: string | null, refresh: string | null = refreshToken.value) {
    token.value = cleanToken(access)
    refreshToken.value = cleanToken(refresh)
    tokenCookie.value = token.value
    refreshCookie.value = refreshToken.value
  }

  function clearTokens() {
    setTokens(null, null)
  }

  return { token, refreshToken, setTokens, clearTokens }
}
