import { create } from 'zustand'
import { db } from '@/db/database'
import type { Account, Category, Transaction, SavingsGoal, Loan } from '@/types'
import { nowISO } from '@/lib/utils'

interface DataState {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  savingsGoals: SavingsGoal[]
  loans: Loan[]
  isLoading: boolean
  loadAll: () => Promise<void>
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateAccount: (id: number, data: Partial<Account>) => Promise<void>
  deleteAccount: (id: number) => Promise<void>
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<void>
  updateCategory: (id: number, data: Partial<Category>) => Promise<void>
  deleteCategory: (id: number) => Promise<void>
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTransaction: (id: number, data: Partial<Transaction>) => Promise<void>
  deleteTransaction: (id: number) => Promise<void>
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateSavingsGoal: (id: number, data: Partial<SavingsGoal>) => Promise<void>
  deleteSavingsGoal: (id: number) => Promise<void>
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateLoan: (id: number, data: Partial<Loan>) => Promise<void>
  deleteLoan: (id: number) => Promise<void>
}

async function updateAccountBalance(accountId: number, amountDelta: number): Promise<void> {
  const account = await db.accounts.get(accountId)
  if (account) {
    await db.accounts.update(accountId, {
      balance: account.balance + amountDelta,
      updatedAt: nowISO(),
    })
  }
}

function getBalanceDelta(type: Transaction['type'], amount: number): number {
  switch (type) {
    case 'income':
    case 'loan_received':
      return amount
    case 'expense':
    case 'saving':
    case 'loan_payment':
      return -amount
    default:
      return 0
  }
}

export const useDataStore = create<DataState>((set, get) => ({
  accounts: [],
  categories: [],
  transactions: [],
  savingsGoals: [],
  loans: [],
  isLoading: false,

  loadAll: async () => {
    set({ isLoading: true })
    const [accounts, categories, transactions, savingsGoals, loans] = await Promise.all([
      db.accounts.toArray(),
      db.categories.toArray(),
      db.transactions.orderBy('date').reverse().toArray(),
      db.savingsGoals.toArray(),
      db.loans.toArray(),
    ])
    set({ accounts, categories, transactions, savingsGoals, loans, isLoading: false })
  },

  addAccount: async (account) => {
    const id = await db.accounts.add({
      ...account,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })
    const newAccount = await db.accounts.get(id)
    if (newAccount) set({ accounts: [...get().accounts, newAccount] })
  },

  updateAccount: async (id, data) => {
    await db.accounts.update(id, { ...data, updatedAt: nowISO() })
    set({ accounts: get().accounts.map((a) => (a.id === id ? { ...a, ...data } : a)) })
  },

  deleteAccount: async (id) => {
    await db.accounts.delete(id)
    set({ accounts: get().accounts.filter((a) => a.id !== id) })
  },

  addCategory: async (category) => {
    const id = await db.categories.add({ ...category, createdAt: nowISO() })
    const newCategory = await db.categories.get(id)
    if (newCategory) set({ categories: [...get().categories, newCategory] })
  },

  updateCategory: async (id, data) => {
    await db.categories.update(id, data)
    set({ categories: get().categories.map((c) => (c.id === id ? { ...c, ...data } : c)) })
  },

  deleteCategory: async (id) => {
    await db.categories.delete(id)
    set({ categories: get().categories.filter((c) => c.id !== id) })
  },

  addTransaction: async (transaction) => {
    const id = await db.transactions.add({
      ...transaction,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })
    const delta = getBalanceDelta(transaction.type, transaction.amount)
    await updateAccountBalance(transaction.accountId, delta)

    if (transaction.loanId) {
      const loan = await db.loans.get(transaction.loanId)
      if (loan && transaction.type === 'loan_payment') {
        const paidAmount = loan.paidAmount + transaction.amount
        const status = paidAmount >= loan.principalAmount ? 'paid' : loan.status
        await db.loans.update(transaction.loanId, { paidAmount, status, updatedAt: nowISO() })
      }
    }

    const newTx = await db.transactions.get(id)
    if (newTx) {
      set({
        transactions: [newTx, ...get().transactions],
        accounts: await db.accounts.toArray(),
        loans: await db.loans.toArray(),
      })
    }
  },

  updateTransaction: async (id, data) => {
    const oldTx = await db.transactions.get(id)
    if (!oldTx) return

    if (data.amount !== undefined || data.type !== undefined || data.accountId !== undefined) {
      const oldDelta = getBalanceDelta(oldTx.type, oldTx.amount)
      await updateAccountBalance(oldTx.accountId, -oldDelta)

      const newType = data.type ?? oldTx.type
      const newAmount = data.amount ?? oldTx.amount
      const newAccountId = data.accountId ?? oldTx.accountId
      const newDelta = getBalanceDelta(newType, newAmount)
      await updateAccountBalance(newAccountId, newDelta)
    }

    await db.transactions.update(id, { ...data, updatedAt: nowISO() })
    const updated = await db.transactions.get(id)
    if (updated) {
      set({
        transactions: get().transactions.map((t) => (t.id === id ? updated : t)),
        accounts: await db.accounts.toArray(),
      })
    }
  },

  deleteTransaction: async (id) => {
    const tx = await db.transactions.get(id)
    if (!tx) return

    const delta = getBalanceDelta(tx.type, tx.amount)
    await updateAccountBalance(tx.accountId, -delta)
    await db.transactions.delete(id)
    set({
      transactions: get().transactions.filter((t) => t.id !== id),
      accounts: await db.accounts.toArray(),
    })
  },

  addSavingsGoal: async (goal) => {
    const id = await db.savingsGoals.add({
      ...goal,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })
    const newGoal = await db.savingsGoals.get(id)
    if (newGoal) set({ savingsGoals: [...get().savingsGoals, newGoal] })
  },

  updateSavingsGoal: async (id, data) => {
    await db.savingsGoals.update(id, { ...data, updatedAt: nowISO() })
    set({ savingsGoals: get().savingsGoals.map((g) => (g.id === id ? { ...g, ...data } : g)) })
  },

  deleteSavingsGoal: async (id) => {
    await db.savingsGoals.delete(id)
    set({ savingsGoals: get().savingsGoals.filter((g) => g.id !== id) })
  },

  addLoan: async (loan) => {
    const id = await db.loans.add({
      ...loan,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })
    const newLoan = await db.loans.get(id)
    if (newLoan) set({ loans: [...get().loans, newLoan] })
  },

  updateLoan: async (id, data) => {
    await db.loans.update(id, { ...data, updatedAt: nowISO() })
    set({ loans: get().loans.map((l) => (l.id === id ? { ...l, ...data } : l)) })
  },

  deleteLoan: async (id) => {
    await db.loans.delete(id)
    set({ loans: get().loans.filter((l) => l.id !== id) })
  },
}))
