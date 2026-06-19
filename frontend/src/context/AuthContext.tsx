import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { login as loginApi } from '@/api'
import { clearStoredAuth, getApiErrorMessage, setStoredToken } from '@/api/client'
import { normalizeLoginUser, resolvePostLoginPath, roleHome } from '@/lib/auth'
import type { User, UserRole } from '@/types'

const USER_KEY = 'zepex_user'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<string>
  logout: () => void
  hasRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as User
    if (!parsed.role && parsed.system_role) {
      parsed.role = parsed.system_role
    }
    return parsed
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser)

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await loginApi(email, password)
    const normalizedUser = normalizeLoginUser(data.user)
    setStoredToken(data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser))
    setUser(normalizedUser)
    return resolvePostLoginPath(normalizedUser, data.redirect_to)
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
    setUser(null)
  }, [])

  const hasRole = useCallback(
    (...roles: UserRole[]) => (user ? roles.includes(user.role) : false),
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      logout,
      hasRole,
    }),
    [user, login, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { getApiErrorMessage, roleHome }
