import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tags,
  Target,
  HandCoins,
  BarChart3,
  Settings,
  Menu,
  X,
  PiggyBank,
  LogOut,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { useState } from 'react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { to: '/cuentas', label: 'Cuentas', icon: Wallet },
  { to: '/categorias', label: 'Categorías', icon: Tags },
  { to: '/ahorros', label: 'Ahorros', icon: Target },
  { to: '/prestamos', label: 'Préstamos', icon: HandCoins },
  { to: '/reportes', label: 'Reportes', icon: BarChart3 },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const isGuest = useAuthStore((s) => s.isGuest)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <PiggyBank className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold">MiCaja</h1>
          <p className="text-xs text-muted-foreground">Finanzas personales</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {user ? user.name : 'Invitado'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user ? user.email : 'Modo sin cuenta'}
            </p>
          </div>
          {isGuest && <Badge variant="secondary" className="text-xs">Invitado</Badge>}
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          {user ? 'Cerrar sesión' : 'Salir'}
        </Button>
      </div>
    </>
  )

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card transition-transform lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent />
      </aside>
    </>
  )
}
