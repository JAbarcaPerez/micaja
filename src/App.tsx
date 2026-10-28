import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute, AuthRoute } from '@/components/auth/ProtectedRoute'
import { DashboardPage } from '@/pages/DashboardPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { AccountsPage } from '@/pages/AccountsPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { LoansPage } from '@/pages/LoansPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { BudgetPage } from '@/pages/BudgetPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export function App() {
  return (
    <BrowserRouter basename={basename || undefined}>
      <Routes>
        <Route element={<AuthRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="movimientos" element={<TransactionsPage />} />
            <Route path="cuentas" element={<AccountsPage />} />
            <Route path="categorias" element={<CategoriesPage />} />
            <Route path="prestamos" element={<LoansPage />} />
            <Route path="presupuesto" element={<BudgetPage />} />
            <Route path="reportes" element={<ReportsPage />} />
            <Route path="configuracion" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
