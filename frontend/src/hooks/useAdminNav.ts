import { useEffect, useState } from 'react'
import { getCompanyAdminDashboard } from '@/api'
import type { NavItem } from '@/components/layout/DashboardLayout'
import { buildAdminNav } from '@/lib/adminNav'
import { isSetupComplete } from '@/lib/adminSetup'

let cachedSetup: Record<string, boolean> | null = null
let cachePromise: Promise<Record<string, boolean>> | null = null

export function fetchAdminSetupStatus(): Promise<Record<string, boolean>> {
  if (cachedSetup) return Promise.resolve(cachedSetup)
  if (!cachePromise) {
    cachePromise = getCompanyAdminDashboard()
      .then((res) => {
        const status = res.data.setup_status ?? {}
        cachedSetup = status
        return status
      })
      .catch(() => {
        const status: Record<string, boolean> = {}
        cachedSetup = status
        return status
      })
  }
  return cachePromise!
}

export function invalidateAdminSetupCache() {
  cachedSetup = null
  cachePromise = null
}

export function useAdminNav() {
  const [navItems, setNavItems] = useState<NavItem[]>(() => buildAdminNav())
  const [setupComplete, setSetupComplete] = useState(false)
  const [setupStatus, setSetupStatus] = useState<Record<string, boolean>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetchAdminSetupStatus().then((status) => {
      const complete = isSetupComplete(status)
      setSetupStatus(status)
      setSetupComplete(complete)
      setNavItems(buildAdminNav())
      setReady(true)
    })
  }, [])

  return { navItems, setupComplete, setupStatus, ready }
}
