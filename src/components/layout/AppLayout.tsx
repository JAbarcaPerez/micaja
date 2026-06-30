import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAutoSync } from '@/hooks/useAutoSync'

export function AppLayout() {
  useAutoSync()

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
