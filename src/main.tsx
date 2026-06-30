import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import { App } from './App'
import { seedDatabase } from '@/db/seed'
import { useDataStore } from '@/stores/dataStore'
import { useAuthStore } from '@/stores/authStore'
import { useThemeEffect } from '@/hooks/useTheme'

registerSW({ immediate: true })

function Bootstrap() {
  const [ready, setReady] = useState(false)
  const loadAll = useDataStore((s) => s.loadAll)
  const initialize = useAuthStore((s) => s.initialize)
  useThemeEffect()

  useEffect(() => {
    async function init() {
      await seedDatabase()
      await initialize()
      await loadAll()
      setReady(true)
    }
    init()
  }, [loadAll, initialize])

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-4 rounded-xl bg-primary animate-pulse" />
          <p className="text-muted-foreground">Cargando MiCaja...</p>
        </div>
      </div>
    )
  }

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>
)
