import { useMemo, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ReportBarChart, CategoryPieChart } from '@/components/charts/FinanceCharts'
import { useDataStore } from '@/stores/dataStore'
import { useCategoryMap, useAccountMap } from '@/hooks/useDashboard'
import { formatCurrency } from '@/lib/format'
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export'
import { groupExpensesByCategory } from '@/lib/filters'
import type { ReportPeriod } from '@/types'
import { Download } from 'lucide-react'

function buildMonthlyReport(transactions: ReturnType<typeof useDataStore.getState>['transactions']): ReportPeriod[] {
  const groups = new Map<string, ReportPeriod>()

  for (const tx of transactions) {
    const key = tx.date.slice(0, 7)
    const current = groups.get(key) ?? { label: key, income: 0, expenses: 0, savings: 0, net: 0 }

    if (tx.type === 'income') current.income += tx.amount
    if (tx.type === 'expense') current.expenses += tx.amount
    if (tx.type === 'saving') current.savings += tx.amount

    current.net = current.income - current.expenses - current.savings
    groups.set(key, current)
  }

  return Array.from(groups.values())
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((r) => ({ ...r, label: r.label.slice(5) + '/' + r.label.slice(2, 4) }))
}

function buildAnnualReport(transactions: ReturnType<typeof useDataStore.getState>['transactions']): ReportPeriod[] {
  const groups = new Map<string, ReportPeriod>()

  for (const tx of transactions) {
    const key = tx.date.slice(0, 4)
    const current = groups.get(key) ?? { label: key, income: 0, expenses: 0, savings: 0, net: 0 }

    if (tx.type === 'income') current.income += tx.amount
    if (tx.type === 'expense') current.expenses += tx.amount
    if (tx.type === 'saving') current.savings += tx.amount

    current.net = current.income - current.expenses - current.savings
    groups.set(key, current)
  }

  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label))
}

export function ReportsPage() {
  const transactions = useDataStore((s) => s.transactions)
  const categoryMap = useCategoryMap()
  const accountMap = useAccountMap()
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly')

  const monthlyData = useMemo(() => buildMonthlyReport(transactions), [transactions])
  const annualData = useMemo(() => buildAnnualReport(transactions), [transactions])
  const expensesByCategory = useMemo(
    () => groupExpensesByCategory(transactions, categoryMap),
    [transactions, categoryMap]
  )

  const currentData = period === 'monthly' ? monthlyData : annualData
  const totals = currentData.reduce(
    (acc, r) => ({
      income: acc.income + r.income,
      expenses: acc.expenses + r.expenses,
      savings: acc.savings + r.savings,
      net: acc.net + r.net,
    }),
    { income: 0, expenses: 0, savings: 0, net: 0 }
  )

  return (
    <div>
      <Header
        title="Reportes"
        description="Análisis mensual y anual de tus finanzas"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportToCSV(transactions, categoryMap, accountMap)}>
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToExcel(transactions, categoryMap, accountMap)}>
                Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToPDF(transactions, categoryMap, accountMap)}>
                Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <Tabs value={period} onValueChange={(v) => setPeriod(v as 'monthly' | 'annual')}>
        <TabsList>
          <TabsTrigger value="monthly">Mensual</TabsTrigger>
          <TabsTrigger value="annual">Anual</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total ingresos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-success">{formatCurrency(totals.income)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totals.expenses)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total ahorros</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(totals.savings)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Balance neto</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${totals.net >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(totals.net)}
                </p>
              </CardContent>
            </Card>
          </div>

          <ReportBarChart
            data={currentData}
            title={period === 'monthly' ? 'Comparativa mensual' : 'Comparativa anual'}
          />

          <CategoryPieChart data={expensesByCategory} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalle por período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4">Período</th>
                      <th className="pb-3 pr-4">Ingresos</th>
                      <th className="pb-3 pr-4">Gastos</th>
                      <th className="pb-3 pr-4">Ahorros</th>
                      <th className="pb-3">Neto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.map((row) => (
                      <tr key={row.label} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{row.label}</td>
                        <td className="py-3 pr-4 text-success">{formatCurrency(row.income)}</td>
                        <td className="py-3 pr-4 text-destructive">{formatCurrency(row.expenses)}</td>
                        <td className="py-3 pr-4">{formatCurrency(row.savings)}</td>
                        <td className={`py-3 font-semibold ${row.net >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(row.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
