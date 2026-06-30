import type { Transaction, Category, Account, FilterState } from '@/types'
import { isWithinInterval, parseISO } from 'date-fns'

export function filterTransactions(
  transactions: Transaction[],
  filters: FilterState
): Transaction[] {
  return transactions.filter((tx) => {
    if (filters.type && tx.type !== filters.type) return false

    if (filters.categoryId && tx.categoryId !== filters.categoryId) return false

    if (filters.accountId && tx.accountId !== filters.accountId) return false

    if (filters.startDate || filters.endDate) {
      const txDate = parseISO(tx.date)
      const start = filters.startDate ? parseISO(filters.startDate) : new Date(0)
      const end = filters.endDate ? parseISO(filters.endDate) : new Date()
      if (!isWithinInterval(txDate, { start, end })) return false
    }

    if (filters.search) {
      const search = filters.search.toLowerCase()
      if (!tx.description.toLowerCase().includes(search)) return false
    }

    return true
  })
}

export function getTransactionsByType(
  transactions: Transaction[],
  type: Transaction['type']
): Transaction[] {
  return transactions.filter((tx) => tx.type === type)
}

export function sumTransactions(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0)
}

export function getCategoryMap(categories: Category[]): Map<number, Category> {
  return new Map(categories.map((c) => [c.id!, c]))
}

export function getAccountMap(accounts: Account[]): Map<number, Account> {
  return new Map(accounts.map((a) => [a.id!, a]))
}

export function groupByMonth(
  transactions: Transaction[]
): { month: string; income: number; expenses: number }[] {
  const groups = new Map<string, { income: number; expenses: number }>()

  for (const tx of transactions) {
    const month = tx.date.slice(0, 7)
    const current = groups.get(month) ?? { income: 0, expenses: 0 }

    if (tx.type === 'income') current.income += tx.amount
    if (tx.type === 'expense') current.expenses += tx.amount

    groups.set(month, current)
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }))
}

export function groupExpensesByCategory(
  transactions: Transaction[],
  categoryMap: Map<number, Category>
): { name: string; value: number; color: string }[] {
  const groups = new Map<number, number>()

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue
    groups.set(tx.categoryId, (groups.get(tx.categoryId) ?? 0) + tx.amount)
  }

  return Array.from(groups.entries())
    .map(([categoryId, value]) => {
      const category = categoryMap.get(categoryId)
      return {
        name: category?.name ?? 'Sin categoría',
        value,
        color: category?.color ?? '#64748b',
      }
    })
    .sort((a, b) => b.value - a.value)
}
