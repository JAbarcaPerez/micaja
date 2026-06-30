import { useEffect } from 'react'
import { useSyncStore } from '@/stores/syncStore'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import { exportBackup, syncToCloud, syncFromCloud, importBackup } from '@/lib/sync'

export function useAutoSync() {
  const { enabled, endpointUrl, apiToken, autoSyncIntervalMinutes, isSyncing, setSyncing, setSyncResult } =
    useSyncStore()
  const user = useAuthStore((s) => s.user)
  const loadAll = useDataStore((s) => s.loadAll)

  useEffect(() => {
    if (!enabled || !endpointUrl || !apiToken || !user) return

    const sync = async () => {
      if (!navigator.onLine || isSyncing) return

      setSyncing(true)
      try {
        const payload = await exportBackup(user.id)
        await syncToCloud(endpointUrl, apiToken, payload)
        setSyncResult('success')
      } catch (err) {
        setSyncResult('error', err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setSyncing(false)
      }
    }

    const intervalMs = autoSyncIntervalMinutes * 60 * 1000
    const timer = setInterval(sync, intervalMs)

    const handleOnline = () => sync()
    window.addEventListener('online', handleOnline)

    return () => {
      clearInterval(timer)
      window.removeEventListener('online', handleOnline)
    }
  }, [enabled, endpointUrl, apiToken, autoSyncIntervalMinutes, user, isSyncing, setSyncing, setSyncResult, loadAll])
}

export async function performCloudSync(
  direction: 'upload' | 'download' | 'merge'
): Promise<string | null> {
  const { endpointUrl, apiToken, setSyncing, setSyncResult } = useSyncStore.getState()
  const user = useAuthStore.getState().user
  const loadAll = useDataStore.getState().loadAll

  if (!endpointUrl || !apiToken) return 'Configura la URL y el token de sincronización'
  if (!user) return 'Inicia sesión para sincronizar en la nube'

  setSyncing(true)
  try {
    if (direction === 'upload') {
      const payload = await exportBackup(user.id)
      await syncToCloud(endpointUrl, apiToken, payload)
    } else if (direction === 'download') {
      const payload = await syncFromCloud(endpointUrl, apiToken)
      await importBackup(payload, true)
      await loadAll()
    } else {
      const remote = await syncFromCloud(endpointUrl, apiToken)
      const local = await exportBackup(user.id)
      const merged = {
        ...remote,
        transactions: mergeById(local.transactions, remote.transactions),
        accounts: mergeById(local.accounts, remote.accounts),
        categories: mergeById(local.categories, remote.categories),
        savingsGoals: mergeById(local.savingsGoals, remote.savingsGoals),
        loans: mergeById(local.loans, remote.loans),
      }
      await importBackup(merged, true)
      await loadAll()
      await syncToCloud(endpointUrl, apiToken, merged)
    }
    setSyncResult('success')
    return null
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de sincronización'
    setSyncResult('error', message)
    return message
  } finally {
    setSyncing(false)
  }
}

function mergeById<T extends { id?: number; updatedAt?: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<number, T>()
  for (const item of remote) {
    if (item.id) map.set(item.id, item)
  }
  for (const item of local) {
    if (!item.id) continue
    const existing = map.get(item.id)
    if (!existing || (item.updatedAt && existing.updatedAt && item.updatedAt > existing.updatedAt)) {
      map.set(item.id, item)
    }
  }
  return Array.from(map.values())
}
