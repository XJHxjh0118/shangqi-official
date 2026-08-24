const TOKEN_COOKIE = 'ow-token'
const TOKEN_SESSION = 'ow-token-s'
const REFRESH_COOKIE = 'ow-refresh'
const REFRESH_SESSION = 'ow-refresh-s'

function cleanToken(value: string | null | undefined) {
  if (!value) return null
  const trimmed = String(value).trim().replace(/^Bearer\s+/i, '')
  const unquoted = trimmed.replace(/^"/, '').replace(/"$/, '')
  return unquoted || null
}

export function useAuthToken() {
  const persistToken = useCookie<string | null>(TOKEN_COOKIE, {
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    default: () => null,
  })
  const sessionToken = useCookie<string | null>(TOKEN_SESSION, {
    sameSite: 'lax',
    default: () => null,
  })
  const persistRefresh = useCookie<string | null>(REFRESH_COOKIE, {
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    default: () => null,
  })
  const sessionRefresh = useCookie<string | null>(REFRESH_SESSION, {
    sameSite: 'lax',
    default: () => null,
  })

  const token = useState<string | null>(
    'ow-access-token',
    () => cleanToken(persistToken.value) || cleanToken(sessionToken.value),
  )
  const refreshToken = useState<string | null>(
    'ow-refresh-token',
    () => cleanToken(persistRefresh.value) || cleanToken(sessionRefresh.value),
  )

  if (!token.value) {
    token.value = cleanToken(persistToken.value) || cleanToken(sessionToken.value)
  }
  if (!refreshToken.value) {
    refreshToken.value =
      cleanToken(persistRefresh.value) || cleanToken(sessionRefresh.value)
  }

  function setTokens(
    access: string | null,
    refresh: string | null = refreshToken.value,
    remember = Boolean(persistToken.value),
  ) {
    token.value = cleanToken(access)
    refreshToken.value = cleanToken(refresh)
    if (!token.value) {
      persistToken.value = null
      sessionToken.value = null
      persistRefresh.value = null
      sessionRefresh.value = null
      return
    }
    if (remember) {
      persistToken.value = token.value
      persistRefresh.value = refreshToken.value
      sessionToken.value = null
      sessionRefresh.value = null
    } else {
      sessionToken.value = token.value
      sessionRefresh.value = refreshToken.value
      persistToken.value = null
      persistRefresh.value = null
    }
  }

  function clearTokens() {
    setTokens(null, null)
  }

  return { token, refreshToken, setTokens, clearTokens }
}
