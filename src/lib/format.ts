import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { TransactionType, AccountType, LoanStatus, LoanDirection } from '@/types'

const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
})

export function formatCurrency(amount: number, currency = 'EUR'): string {
  if (currency === 'EUR') return currencyFormatter.format(amount)
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string): string {
  return format(parseISO(date), 'dd MMM yyyy', { locale: es })
}

export function formatDateShort(date: string): string {
  return format(parseISO(date), 'dd/MM/yy', { locale: es })
}

export function formatMonth(date: string): string {
  return format(parseISO(date), 'MMM yyyy', { locale: es })
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

const transactionTypeLabels: Record<TransactionType, string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  saving: 'Ahorro',
  loan_payment: 'Pago de préstamo',
  loan_received: 'Préstamo recibido',
}

const accountTypeLabels: Record<AccountType, string> = {
  cash: 'Efectivo',
  bank: 'Banco',
  digital_wallet: 'Billetera digital',
  savings: 'Ahorro',
}

const loanStatusLabels: Record<LoanStatus, string> = {
  active: 'Activo',
  paid: 'Pagado',
  overdue: 'Vencido',
  cancelled: 'Cancelado',
}

const loanDirectionLabels: Record<LoanDirection, string> = {
  lent: 'Prestado',
  borrowed: 'Recibido',
}

export function getTransactionTypeLabel(type: TransactionType): string {
  return transactionTypeLabels[type]
}

export function getAccountTypeLabel(type: AccountType): string {
  return accountTypeLabels[type]
}

export function getLoanStatusLabel(status: LoanStatus): string {
  return loanStatusLabels[status]
}

export function getLoanDirectionLabel(direction: LoanDirection): string {
  return loanDirectionLabels[direction]
}
