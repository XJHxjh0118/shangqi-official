import type { AuthLoginResult, AuthProfile } from '~/types/api'
import { normalizeSubmitError } from '~/utils/form'

function unwrapLogin(data: AuthLoginResult | { data?: AuthLoginResult }) {
  if (data && typeof data === 'object' && 'accessToken' in data && data.accessToken) {
    return data
  }
  if (data && typeof data === 'object' && 'data' in data && data.data) {
    return data.data
  }
  return null
}

function pickAccessToken(data: AuthLoginResult | { data?: AuthLoginResult }) {
  return unwrapLogin(data)?.accessToken || null
}

function pickRefreshToken(data: AuthLoginResult | { data?: AuthLoginResult }) {
  return unwrapLogin(data)?.refreshToken || null
}

export function useAuth() {
  const { token, setTokens, clearTokens } = useAuthToken()
  const profile = useState<AuthProfile | null>('auth-profile', () => null)
  const { login: apiLogin, register: apiRegister, getProfile } = useApi()

  const isLoggedIn = computed(() => Boolean(token.value))

  async function login(email: string, password: string, remember = true) {
    const data = await apiLogin({ username: email.trim(), password })
    const accessToken = pickAccessToken(data)
    const refresh = pickRefreshToken(data)
    if (!accessToken) {
      throw createError({
        statusCode: 502,
        statusMessage: '登录成功但未返回令牌',
      })
    }
    setTokens(accessToken, refresh, remember)
    profile.value = await getProfile(accessToken)
    return data
  }

  async function register(payload: Parameters<typeof apiRegister>[0]) {
    return apiRegister(payload)
  }

  async function fetchProfile() {
    if (!token.value) {
      profile.value = null
      return null
    }
    try {
      profile.value = await getProfile(token.value)
      return profile.value
    } catch (err: unknown) {
      const status = Number(
        (err as { statusCode?: number; status?: number })?.statusCode ||
          (err as { statusCode?: number; status?: number })?.status ||
          0,
      )
      if (status === 401) {
        logout()
      }
      throw err
    }
  }

  function logout() {
    const { clear: clearFavorites } = useFavorites()
    const { clear: clearInquiry } = useInquiryList()
    clearTokens()
    profile.value = null
    clearFavorites()
    clearInquiry()
  }

  function authErrorMessage(err: unknown) {
    return normalizeSubmitError(err)
  }

  return {
    token,
    profile,
    isLoggedIn,
    login,
    register,
    fetchProfile,
    logout,
    authErrorMessage,
  }
}
