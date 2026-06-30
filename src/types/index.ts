/** Tipos de movimiento financiero */
export type TransactionType = 'income' | 'expense' | 'saving' | 'loan_payment' | 'loan_received'

/** Tipos de cuenta */
export type AccountType = 'cash' | 'bank' | 'digital_wallet' | 'savings'

/** Estados de préstamo */
export type LoanStatus = 'active' | 'paid' | 'overdue' | 'cancelled'

/** Dirección del préstamo */
export type LoanDirection = 'lent' | 'borrowed'

export interface Account {
  id?: number
  name: string
  type: AccountType
  balance: number
  currency: string
  color: string
  icon: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Category {
  id?: number
  name: string
  type: TransactionType
  color: string
  icon: string
  isActive: boolean
  createdAt: string
}

export interface Transaction {
  id?: number
  type: TransactionType
  amount: number
  description: string
  categoryId: number
  accountId: number
  date: string
  notes?: string
  loanId?: number
  createdAt: string
  updatedAt: string
}

export interface SavingsGoal {
  id?: number
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  color: string
  icon: string
  accountId?: number
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface Loan {
  id?: number
  personName: string
  direction: LoanDirection
  principalAmount: number
  paidAmount: number
  interestRate?: number
  status: LoanStatus
  startDate: string
  dueDate?: string
  description?: string
  accountId?: number
  createdAt: string
  updatedAt: string
}

export interface FilterState {
  startDate?: string
  endDate?: string
  categoryId?: number
  accountId?: number
  type?: TransactionType
  search?: string
}

export interface DashboardSummary {
  totalIncome: number
  totalExpenses: number
  totalSavings: number
  netBalance: number
  accountBalances: { account: Account; balance: number }[]
  recentTransactions: Transaction[]
  monthlyTrend: { month: string; income: number; expenses: number }[]
  expensesByCategory: { name: string; value: number; color: string }[]
}

export interface ReportPeriod {
  label: string
  income: number
  expenses: number
  savings: number
  net: number
}

export interface User {
  id?: number
  name: string
  email: string
  passwordHash: string
  salt: string
  createdAt: string
  lastLoginAt?: string
}

export interface AuthUser {
  id: number
  name: string
  email: string
}

export interface BackupPayload {
  version: number
  exportedAt: string
  userId?: number
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  savingsGoals: SavingsGoal[]
  loans: Loan[]
}

export interface SyncConfig {
  enabled: boolean
  endpointUrl: string
  apiToken: string
  autoSyncIntervalMinutes: number
  lastSyncAt?: string
  lastSyncStatus?: 'success' | 'error' | 'pending'
  lastSyncError?: string
}
