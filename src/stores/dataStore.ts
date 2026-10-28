import { create } from 'zustand'
import { db } from '@/db/database'
import type { Account, Category, Transaction, SavingsGoal, Loan, BudgetItem, BudgetRubro } from '@/types'
import { nowISO } from '@/lib/utils'
import {
  DEFAULT_BUDGET_TEMPLATES,
  currentMonthKey,
  remainingBudget,
  remainingToAllocate,
  slugifyRubro,
  nextBudgetColor,
} from '@/lib/budget'
import type { BudgetKind } from '@/types'

interface DataState {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  savingsGoals: SavingsGoal[]
  loans: Loan[]
  budgets: BudgetItem[]
  isLoading: boolean
  loadAll: () => Promise<void>
  ensureMonthBudgets: (month?: string) => Promise<void>
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateAccount: (id: number, data: Partial<Account>) => Promise<void>
  deleteAccount: (id: number) => Promise<void>
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<void>
  updateCategory: (id: number, data: Partial<Category>) => Promise<void>
  deleteCategory: (id: number) => Promise<void>
  /** Devuelve mensaje de error o null si todo ok */
  addTransaction: (
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<string | null>
  updateTransaction: (id: number, data: Partial<Transaction>) => Promise<string | null>
  deleteTransaction: (id: number) => Promise<void>
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateSavingsGoal: (id: number, data: Partial<SavingsGoal>) => Promise<void>
  deleteSavingsGoal: (id: number) => Promise<void>
  addLoan: (loan: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateLoan: (id: number, data: Partial<Loan>) => Promise<void>
  deleteLoan: (id: number) => Promise<void>
  updateBudgetPlanned: (id: number, plannedAmount: number) => Promise<string | null>
  allocateToBudget: (id: number, amount: number) => Promise<string | null>
  addBudgetCategory: (
    month: string,
    name: string,
    kind: BudgetKind,
    plannedAmount?: number
  ) => Promise<string | null>
  deleteBudgetCategory: (id: number) => Promise<string | null>
  getMainAccount: () => Account | undefined
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

function isSpendingType(type: Transaction['type']): boolean {
  return type === 'expense' || type === 'saving' || type === 'loan_payment'
}

export const useDataStore = create<DataState>((set, get) => ({
  accounts: [],
  categories: [],
  transactions: [],
  savingsGoals: [],
  loans: [],
  budgets: [],
  isLoading: false,

  getMainAccount: () => {
    const accounts = get().accounts.filter((a) => a.isActive)
    return (
      accounts.find((a) => a.name.toLowerCase().includes('principal')) ||
      accounts.find((a) => a.type === 'bank') ||
      accounts[0]
    )
  },

  loadAll: async () => {
    set({ isLoading: true })
    const [accounts, categories, transactions, savingsGoals, loans, budgets] = await Promise.all([
      db.accounts.toArray(),
      db.categories.toArray(),
      db.transactions.orderBy('date').reverse().toArray(),
      db.savingsGoals.toArray(),
      db.loans.toArray(),
      db.budgets.toArray(),
    ])
    set({ accounts, categories, transactions, savingsGoals, loans, budgets, isLoading: false })
    await get().ensureMonthBudgets()
  },

  ensureMonthBudgets: async (month) => {
    const m = month ?? currentMonthKey()
    let existing = await db.budgets.where('month').equals(m).toArray()

    // Eliminar duplicados del mismo rubro+mes (bug por double-mount en desarrollo)
    const seen = new Map<string, BudgetItem>()
    const duplicateIds: number[] = []
    for (const item of existing) {
      const key = item.rubro
      const prev = seen.get(key)
      if (prev) {
        // Conservar el que tenga más actividad
        const prevScore = prev.plannedAmount + prev.spentAmount + prev.allocatedAmount
        const curScore = item.plannedAmount + item.spentAmount + item.allocatedAmount
        if (curScore > prevScore && item.id) {
          if (prev.id) duplicateIds.push(prev.id)
          seen.set(key, item)
        } else if (item.id) {
          duplicateIds.push(item.id)
        }
      } else {
        seen.set(key, item)
      }
    }
    if (duplicateIds.length > 0) {
      await db.budgets.bulkDelete(duplicateIds)
      existing = await db.budgets.where('month').equals(m).toArray()
    }

    // Migrar registros viejos sin name/kind/color
    for (const item of existing) {
      if (!item.name || !item.kind) {
        const tpl = DEFAULT_BUDGET_TEMPLATES.find((t) => t.rubro === item.rubro)
        await db.budgets.update(item.id!, {
          name: item.name || tpl?.name || item.rubro,
          kind: item.kind || tpl?.kind || 'expense',
          color: item.color || tpl?.color || '#64748b',
          updatedAt: nowISO(),
        })
      }
    }

    existing = await db.budgets.where('month').equals(m).toArray()
    const existingRubros = new Set(existing.map((b) => b.rubro))
    const toCreate: Omit<BudgetItem, 'id'>[] = []

    for (const tpl of DEFAULT_BUDGET_TEMPLATES) {
      if (!existingRubros.has(tpl.rubro)) {
        toCreate.push({
          rubro: tpl.rubro,
          name: tpl.name,
          kind: tpl.kind,
          color: tpl.color,
          plannedAmount: 0,
          allocatedAmount: 0,
          spentAmount: 0,
          month: m,
          updatedAt: nowISO(),
        })
      }
    }

    if (toCreate.length > 0) {
      await db.budgets.bulkAdd(toCreate)
    }

    const budgets = await db.budgets.toArray()
    set({ budgets })
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
    const amount = transaction.amount
    if (!amount || amount <= 0) return 'El monto debe ser mayor a 0'

    const account = await db.accounts.get(transaction.accountId)
    if (!account) return 'Cuenta no encontrada'

    // 1) No permitir gastos/ahorros/pagos si la cuenta no tiene saldo suficiente
    if (isSpendingType(transaction.type)) {
      if (account.balance < amount) {
        return 'Saldo insuficiente en la cuenta seleccionada'
      }

      // 2) Gastos (excepto pago de préstamo) requieren saldo ASIGNADO al rubro
      if (transaction.type === 'expense' || transaction.type === 'saving') {
        if (!transaction.budgetRubro) {
          return 'Selecciona un rubro del presupuesto con saldo asignado'
        }
        const month = (transaction.date || '').slice(0, 7) || currentMonthKey()
        await get().ensureMonthBudgets(month)
        const budget = (await db.budgets.where({ rubro: transaction.budgetRubro, month }).first()) as
          | BudgetItem
          | undefined

        if (!budget) {
          return 'No hay presupuesto configurado para este rubro'
        }
        if (!budget.allocatedAmount || budget.allocatedAmount <= 0) {
          return `Saldo no asignado a la categoría "${budget.name || budget.rubro}". Asigna saldo en Presupuesto antes de registrar el movimiento.`
        }
        // Disponible = lo asignado menos lo ya gastado
        const availableAllocated = Math.max(0, budget.allocatedAmount - budget.spentAmount)
        if (amount > availableAllocated) {
          return `Saldo insuficiente en la categoría "${budget.name || budget.rubro}". Asignado disponible: ${availableAllocated.toFixed(2)}`
        }

        await db.budgets.update(budget.id!, {
          spentAmount: budget.spentAmount + amount,
          updatedAt: nowISO(),
        })
      }
    }

    const id = await db.transactions.add({
      ...transaction,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })
    const delta = getBalanceDelta(transaction.type, amount)
    await updateAccountBalance(transaction.accountId, delta)

    if (transaction.loanId && transaction.type === 'loan_payment') {
      const loan = await db.loans.get(transaction.loanId)
      if (loan) {
        const paidAmount = loan.paidAmount + amount
        const totalInst = loan.totalInstallments ?? 0
        const paidInst = (loan.paidInstallments ?? 0) + 1
        const status =
          paidAmount >= loan.principalAmount || (totalInst > 0 && paidInst >= totalInst)
            ? 'paid'
            : loan.status
        await db.loans.update(transaction.loanId, {
          paidAmount,
          paidInstallments: paidInst,
          status,
          updatedAt: nowISO(),
        })
      }
    }

    const newTx = await db.transactions.get(id)
    if (newTx) {
      set({
        transactions: [newTx, ...get().transactions],
        accounts: await db.accounts.toArray(),
        loans: await db.loans.toArray(),
        budgets: await db.budgets.toArray(),
      })
    }
    return null
  },

  updateTransaction: async (id, data) => {
    const oldTx = await db.transactions.get(id)
    if (!oldTx) return 'Movimiento no encontrado'

    if (data.amount !== undefined || data.type !== undefined || data.accountId !== undefined) {
      const oldDelta = getBalanceDelta(oldTx.type, oldTx.amount)
      await updateAccountBalance(oldTx.accountId, -oldDelta)

      const newType = data.type ?? oldTx.type
      const newAmount = data.amount ?? oldTx.amount
      const newAccountId = data.accountId ?? oldTx.accountId

      if (isSpendingType(newType)) {
        const account = await db.accounts.get(newAccountId)
        if (!account || account.balance < newAmount) {
          // revertir el deshacer del saldo anterior
          await updateAccountBalance(oldTx.accountId, oldDelta)
          return 'Saldo insuficiente en la cuenta'
        }
      }

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
    return null
  },

  deleteTransaction: async (id) => {
    const tx = await db.transactions.get(id)
    if (!tx) return

    const delta = getBalanceDelta(tx.type, tx.amount)
    await updateAccountBalance(tx.accountId, -delta)

    // Devolver el gasto al presupuesto si tenía rubro
    if (tx.budgetRubro && isSpendingType(tx.type)) {
      const month = (tx.date || '').slice(0, 7) || currentMonthKey()
      const budget = await db.budgets.where({ rubro: tx.budgetRubro, month }).first()
      if (budget) {
        await db.budgets.update(budget.id!, {
          spentAmount: Math.max(0, budget.spentAmount - tx.amount),
          updatedAt: nowISO(),
        })
      }
    }

    await db.transactions.delete(id)
    set({
      transactions: get().transactions.filter((t) => t.id !== id),
      accounts: await db.accounts.toArray(),
      budgets: await db.budgets.toArray(),
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

  updateBudgetPlanned: async (id, plannedAmount) => {
    if (plannedAmount < 0) return 'El presupuesto no puede ser negativo'
    const item = await db.budgets.get(id)
    if (!item) return 'Presupuesto no encontrado'
    if (plannedAmount < item.spentAmount) {
      return `El presupuesto no puede ser menor a lo ya gastado (${item.spentAmount.toFixed(2)})`
    }
    if (plannedAmount < item.allocatedAmount) {
      return `El presupuesto no puede ser menor a lo ya asignado (${item.allocatedAmount.toFixed(2)})`
    }
    await db.budgets.update(id, { plannedAmount, updatedAt: nowISO() })
    set({ budgets: await db.budgets.toArray() })
    return null
  },

  allocateToBudget: async (id, amount) => {
    if (amount <= 0) return 'El monto a asignar debe ser mayor a 0'
    const item = await db.budgets.get(id)
    if (!item) return 'Presupuesto no encontrado'

    const max = remainingToAllocate(item)
    if (amount > max) {
      return `Solo puedes asignar hasta ${max.toFixed(2)} (límite del presupuesto)`
    }

    const main = get().getMainAccount()
    if (!main) return 'No hay cuenta principal configurada'
    if (main.balance < amount) {
      return 'Saldo insuficiente en la cuenta principal para asignar'
    }

    await db.budgets.update(id, {
      allocatedAmount: item.allocatedAmount + amount,
      updatedAt: nowISO(),
    })
    set({ budgets: await db.budgets.toArray() })
    return null
  },

  addBudgetCategory: async (month, name, kind, plannedAmount = 0) => {
    const trimmed = name.trim()
    if (!trimmed) return 'El nombre es obligatorio'

    await get().ensureMonthBudgets(month)
    const existing = await db.budgets.where('month').equals(month).toArray()
    const rubro = slugifyRubro(trimmed)

    if (existing.some((b) => b.rubro === rubro || b.name.toLowerCase() === trimmed.toLowerCase())) {
      return 'Ya existe una categoría con ese nombre en este mes'
    }

    await db.budgets.add({
      rubro,
      name: trimmed,
      kind,
      color: nextBudgetColor(existing),
      plannedAmount: Math.max(0, plannedAmount),
      allocatedAmount: 0,
      spentAmount: 0,
      month,
      updatedAt: nowISO(),
    })
    set({ budgets: await db.budgets.toArray() })
    return null
  },

  deleteBudgetCategory: async (id) => {
    const item = await db.budgets.get(id)
    if (!item) return 'Categoría no encontrada'
    if (item.spentAmount > 0) {
      return 'No se puede eliminar: ya tiene gastos registrados. Pon el presupuesto en 0 si ya no la usas.'
    }
    await db.budgets.delete(id)
    set({ budgets: await db.budgets.toArray() })
    return null
  },
}))
