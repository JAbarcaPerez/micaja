import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { FilterBar } from '@/components/shared/FilterBar'
import { TransactionList } from '@/components/shared/TransactionList'
import { TransactionForm } from '@/components/forms/TransactionForm'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFilteredTransactions, useCategoryMap, useAccountMap } from '@/hooks/useDashboard'
import { useDataStore } from '@/stores/dataStore'
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export'
import type { Transaction } from '@/types'
import { Plus, Download } from 'lucide-react'

export function TransactionsPage() {
  const filtered = useFilteredTransactions()
  const categoryMap = useCategoryMap()
  const accountMap = useAccountMap()
  const deleteTransaction = useDataStore((s) => s.deleteTransaction)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | undefined>()

  const handleEdit = (tx: Transaction) => {
    setEditing(tx)
    setFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar este movimiento?')) {
      await deleteTransaction(id)
    }
  }

  const handleNew = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  return (
    <div>
      <Header
        title="Movimientos"
        description="Registra y gestiona tus ingresos, gastos y ahorros"
        actions={
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportToCSV(filtered, categoryMap, accountMap)}>
                  Exportar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToExcel(filtered, categoryMap, accountMap)}>
                  Exportar Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToPDF(filtered, categoryMap, accountMap)}>
                  Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" onClick={handleNew}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        <FilterBar />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {filtered.length} movimiento{filtered.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionList
              transactions={filtered}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      </div>

      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        transaction={editing}
      />
    </div>
  )
}
