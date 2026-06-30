import { useCategoryMap, useAccountMap } from '@/hooks/useDashboard'
import { formatCurrency, formatDateShort, getTransactionTypeLabel } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import type { Transaction, TransactionType } from '@/types'
import { cn } from '@/lib/utils'

const typeVariants: Record<TransactionType, 'success' | 'destructive' | 'secondary' | 'warning' | 'default'> = {
  income: 'success',
  expense: 'destructive',
  saving: 'secondary',
  loan_payment: 'warning',
  loan_received: 'default',
}

interface TransactionListProps {
  transactions: Transaction[]
  onEdit?: (tx: Transaction) => void
  onDelete?: (id: number) => void
  compact?: boolean
}

export function TransactionList({ transactions, onEdit, onDelete, compact }: TransactionListProps) {
  const categoryMap = useCategoryMap()
  const accountMap = useAccountMap()

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>No hay movimientos registrados</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const category = categoryMap.get(tx.categoryId)
        const account = accountMap.get(tx.accountId)
        const isIncome = tx.type === 'income' || tx.type === 'loan_received'

        return (
          <div
            key={tx.id}
            className={cn(
              'flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50',
              onEdit && 'cursor-pointer'
            )}
            onClick={() => onEdit?.(tx)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: category?.color ?? '#64748b' }}
              >
                {category?.name.charAt(0) ?? '?'}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{tx.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDateShort(tx.date)}</span>
                  {!compact && (
                    <>
                      <span>·</span>
                      <span>{account?.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!compact && (
                <Badge variant={typeVariants[tx.type]}>
                  {getTransactionTypeLabel(tx.type)}
                </Badge>
              )}
              <span className={cn('font-semibold', isIncome ? 'text-success' : 'text-destructive')}>
                {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
              </span>
              {onDelete && (
                <button
                  className="text-muted-foreground hover:text-destructive text-sm ml-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(tx.id!)
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
