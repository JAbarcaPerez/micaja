import { Header } from '@/components/layout/Header'
import { StatCard } from '@/components/shared/StatCard'
import { TransactionList } from '@/components/shared/TransactionList'
import { TrendChart, CategoryPieChart } from '@/components/charts/FinanceCharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardData } from '@/hooks/useDashboard'
import { formatCurrency } from '@/lib/format'
import { TrendingUp, TrendingDown, PiggyBank, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function DashboardPage() {
  const summary = useDashboardData()

  return (
    <div>
      <Header title="Dashboard" description="Resumen de tus finanzas personales" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Ingresos"
          value={formatCurrency(summary.totalIncome)}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Gastos"
          value={formatCurrency(summary.totalExpenses)}
          icon={TrendingDown}
          variant="danger"
        />
        <StatCard
          title="Ahorros"
          value={formatCurrency(summary.totalSavings)}
          icon={PiggyBank}
          variant="default"
        />
        <StatCard
          title="Balance neto"
          value={formatCurrency(summary.netBalance)}
          icon={Wallet}
          variant={summary.netBalance >= 0 ? 'success' : 'danger'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <TrendChart data={summary.monthlyTrend} />
        <CategoryPieChart data={summary.expensesByCategory} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimos movimientos</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/movimientos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <TransactionList transactions={summary.recentTransactions} compact />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cuentas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.accountBalances.map(({ account, balance }) => (
              <div key={account.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: account.color }}
                  />
                  <span className="text-sm">{account.name}</span>
                </div>
                <span className="font-semibold text-sm">{formatCurrency(balance)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
