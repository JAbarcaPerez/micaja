import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useFilterStore } from '@/stores/filterStore'
import { useDataStore } from '@/stores/dataStore'
import { getTransactionTypeLabel } from '@/lib/format'
import type { TransactionType } from '@/types'
import { X } from 'lucide-react'

const transactionTypes: TransactionType[] = ['income', 'expense', 'saving', 'loan_payment', 'loan_received']

export function FilterBar() {
  const filters = useFilterStore()
  const { setFilter, clearFilters } = useFilterStore()
  const categories = useDataStore((s) => s.categories)
  const accounts = useDataStore((s) => s.accounts)

  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '')

  return (
    <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
      <div className="space-y-2">
        <Label>Desde</Label>
        <Input
          type="date"
          value={filters.startDate ?? ''}
          onChange={(e) => setFilter('startDate', e.target.value || undefined)}
        />
      </div>
      <div className="space-y-2">
        <Label>Hasta</Label>
        <Input
          type="date"
          value={filters.endDate ?? ''}
          onChange={(e) => setFilter('endDate', e.target.value || undefined)}
        />
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select
          value={filters.type ?? 'all'}
          onValueChange={(v) => setFilter('type', v === 'all' ? undefined : (v as TransactionType))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {transactionTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {getTransactionTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select
          value={filters.categoryId?.toString() ?? 'all'}
          onValueChange={(v) => setFilter('categoryId', v === 'all' ? undefined : Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id!.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Cuenta</Label>
        <Select
          value={filters.accountId?.toString() ?? 'all'}
          onValueChange={(v) => setFilter('accountId', v === 'all' ? undefined : Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id!.toString()}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Buscar</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Descripción..."
            value={filters.search ?? ''}
            onChange={(e) => setFilter('search', e.target.value || undefined)}
          />
          {hasFilters && (
            <Button variant="outline" size="icon" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
