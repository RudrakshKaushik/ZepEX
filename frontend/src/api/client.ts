import axios from 'axios'

const TOKEN_KEY = 'zepex_token'

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

const PUBLIC_API_PATHS = ['/auth/login/', '/platform/register-company/']

api.interceptors.request.use((config) => {
  const url = config.url ?? ''
  const isPublic = PUBLIC_API_PATHS.some((path) => url.includes(path))
  if (isPublic) {
    delete config.headers.Authorization
    return config
  }
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('zepex_user')
      const path = window.location.pathname
      const isPublicPage =
        path === '/login' || path === '/platform/login' || path === '/register'
      if (!isPublicPage) {
        window.location.href = path.startsWith('/platform') ? '/platform/login' : '/login'
      }
    }
    return Promise.reject(error)
  },
)

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('zepex_user')
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (typeof data === 'string') return data
    if (data?.error) return String(data.error)
    if (data?.message) return String(data.message)
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>
      if (Array.isArray(record.non_field_errors) && record.non_field_errors[0]) {
        return String(record.non_field_errors[0])
      }
      const firstKey = Object.keys(record)[0]
      if (firstKey) {
        const val = record[firstKey]
        if (Array.isArray(val)) return String(val[0])
        return String(val)
      }
    }
    return error.message
  }
  return 'Something went wrong'
}
