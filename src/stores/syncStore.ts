import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SyncConfig } from '@/types'

interface SyncState extends SyncConfig {
  isSyncing: boolean
  setConfig: (config: Partial<SyncConfig>) => void
  setSyncing: (syncing: boolean) => void
  setSyncResult: (status: 'success' | 'error', error?: string) => void
}

const defaultConfig: SyncConfig = {
  enabled: false,
  endpointUrl: '',
  apiToken: '',
  autoSyncIntervalMinutes: 5,
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      ...defaultConfig,
      isSyncing: false,

      setConfig: (config) => set(config),

      setSyncing: (isSyncing) => set({ isSyncing }),

      setSyncResult: (status, error) =>
        set({
          lastSyncAt: new Date().toISOString(),
          lastSyncStatus: status,
          lastSyncError: error,
        }),
    }),
    { name: 'micaja-sync' }
  )
)
