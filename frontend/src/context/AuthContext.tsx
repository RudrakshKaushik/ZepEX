import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getProfile, login as loginApi } from '@/api'
import { clearStoredAuth, getApiErrorMessage, getStoredToken, setStoredToken } from '@/api/client'
import { normalizeLoginUser, resolvePostLoginPath, roleHome } from '@/lib/auth'
import { resolveUserPermissions } from '@/lib/permissions'
import type { User, UserRole } from '@/types'

const USER_KEY = 'zepex_user'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  permissionsReady: boolean
  login: (email: string, password: string) => Promise<string>
  logout: () => void
  hasRole: (...roles: UserRole[]) => boolean
  refreshPermissions: () => Promise<void>
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

function mergeProfileIntoUser(user: User, profile: Awaited<ReturnType<typeof getProfile>>['data']): User {
  return {
    ...user,
    first_name: profile.first_name,
    last_name: profile.last_name,
    profile_picture: profile.profile_picture ?? null,
    company_role: profile.company_role ?? user.company_role ?? null,
    company_role_id: profile.company_role_id ?? user.company_role_id ?? null,
    permissions: resolveUserPermissions(profile.role, profile.permissions),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser)
  const [permissionsReady, setPermissionsReady] = useState(false)

  const refreshPermissions = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setPermissionsReady(true)
      return
    }

    try {
      const { data: profile } = await getProfile()
      setUser((prev) => {
        if (!prev) return prev
        const updated = mergeProfileIntoUser(prev, profile)
        localStorage.setItem(USER_KEY, JSON.stringify(updated))
        return updated
      })
    } catch {
      // Keep stored session if profile refresh fails.
    } finally {
      setPermissionsReady(true)
    }
  }, [])

  useEffect(() => {
    void refreshPermissions()
  }, [refreshPermissions])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await loginApi(email, password)
    const normalizedUser = normalizeLoginUser(data.user)
    setStoredToken(data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser))
    setUser(normalizedUser)
    setPermissionsReady(true)
    return resolvePostLoginPath(normalizedUser, data.redirect_to)
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
    setUser(null)
    setPermissionsReady(true)
  }, [])

  const hasRole = useCallback(
    (...roles: UserRole[]) => (user ? roles.includes(user.role) : false),
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      permissionsReady,
      login,
      logout,
      hasRole,
      refreshPermissions,
    }),
    [user, permissionsReady, login, logout, hasRole, refreshPermissions],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { getApiErrorMessage, roleHome }
