import { useMemo } from 'react'
import { useDataStore } from '@/stores/dataStore'
import { useFilterStore } from '@/stores/filterStore'
import { filterTransactions, getCategoryMap, getAccountMap, groupByMonth, groupExpensesByCategory } from '@/lib/filters'
import type { DashboardSummary } from '@/types'

export function useDashboardData(): DashboardSummary {
  const transactions = useDataStore((s) => s.transactions)
  const accounts = useDataStore((s) => s.accounts)
  const categories = useDataStore((s) => s.categories)

  return useMemo(() => {
    const categoryMap = getCategoryMap(categories)
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0)
    const totalExpenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)
    const totalSavings = transactions
      .filter((t) => t.type === 'saving')
      .reduce((s, t) => s + t.amount, 0)

    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      netBalance: totalIncome - totalExpenses - totalSavings,
      accountBalances: accounts.map((account) => ({
        account,
        balance: account.balance,
      })),
      recentTransactions: transactions.slice(0, 5),
      monthlyTrend: groupByMonth(transactions),
      expensesByCategory: groupExpensesByCategory(transactions, categoryMap),
    }
  }, [transactions, accounts, categories])
}

export function useFilteredTransactions() {
  const transactions = useDataStore((s) => s.transactions)
  const filters = useFilterStore()

  return useMemo(
    () => filterTransactions(transactions, filters),
    [transactions, filters]
  )
}

export function useCategoryMap() {
  const categories = useDataStore((s) => s.categories)
  return useMemo(() => getCategoryMap(categories), [categories])
}

export function useAccountMap() {
  const accounts = useDataStore((s) => s.accounts)
  return useMemo(() => getAccountMap(accounts), [accounts])
}
