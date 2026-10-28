import type { BudgetRubro, BudgetItem, BudgetKind } from '@/types'

export const DEFAULT_BUDGET_TEMPLATES: {
  rubro: BudgetRubro
  name: string
  kind: BudgetKind
  color: string
}[] = [
  { rubro: 'gastos_fijos', name: 'Gastos fijos', kind: 'expense', color: '#8b5cf6' },
  { rubro: 'gastos_variables', name: 'Gastos variables', kind: 'expense', color: '#f97316' },
  { rubro: 'ahorro', name: 'Ahorro', kind: 'saving', color: '#22c55e' },
  { rubro: 'fondo_emergencia', name: 'Fondo de emergencia', kind: 'saving', color: '#0ea5e9' },
]

/** @deprecated usar item.name */
export const BUDGET_RUBRO_LABELS: Record<string, string> = Object.fromEntries(
  DEFAULT_BUDGET_TEMPLATES.map((t) => [t.rubro, t.name])
)

export const BUDGET_RUBRO_COLORS: Record<string, string> = Object.fromEntries(
  DEFAULT_BUDGET_TEMPLATES.map((t) => [t.rubro, t.color])
)

export const BUDGET_RUBROS = DEFAULT_BUDGET_TEMPLATES.map((t) => t.rubro)

export function getBudgetLabel(item: BudgetItem | string): string {
  if (typeof item === 'string') {
    return BUDGET_RUBRO_LABELS[item] ?? item.replace(/_/g, ' ')
  }
  return item.name || BUDGET_RUBRO_LABELS[item.rubro] || item.rubro
}

export function getBudgetColor(item: BudgetItem | string): string {
  if (typeof item === 'string') {
    return BUDGET_RUBRO_COLORS[item] ?? '#64748b'
  }
  return item.color || BUDGET_RUBRO_COLORS[item.rubro] || '#64748b'
}

/** Rubros del mes filtrados por tipo de movimiento */
export function filterBudgetsForType(budgets: BudgetItem[], type: string): BudgetItem[] {
  if (type === 'expense' || type === 'loan_payment') {
    return budgets.filter((b) => b.kind === 'expense')
  }
  if (type === 'saving') {
    return budgets.filter((b) => b.kind === 'saving')
  }
  return []
}

/** @deprecated preferir filterBudgetsForType */
export function rubrosForType(type: string): BudgetRubro[] {
  if (type === 'expense' || type === 'loan_payment') {
    return DEFAULT_BUDGET_TEMPLATES.filter((t) => t.kind === 'expense').map((t) => t.rubro)
  }
  if (type === 'saving') {
    return DEFAULT_BUDGET_TEMPLATES.filter((t) => t.kind === 'saving').map((t) => t.rubro)
  }
  return []
}

export function currentMonthKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function remainingBudget(item: BudgetItem): number {
  return Math.max(0, item.plannedAmount - item.spentAmount)
}

/** Disponible según saldo ASIGNADO (lo que se puede gastar de verdad) */
export function remainingAllocated(item: BudgetItem): number {
  return Math.max(0, (item.allocatedAmount || 0) - item.spentAmount)
}

export function remainingToAllocate(item: BudgetItem): number {
  return Math.max(0, item.plannedAmount - item.allocatedAmount)
}

export function budgetProgress(item: BudgetItem): number {
  if (item.plannedAmount <= 0) return 0
  return Math.min(100, Math.round((item.spentAmount / item.plannedAmount) * 100))
}

export function slugifyRubro(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40) || `rubro_${Date.now()}`
}

const EXTRA_COLORS = ['#ef4444', '#eab308', '#06b6d4', '#ec4899', '#6366f1', '#84cc16', '#f43f5e']

export function nextBudgetColor(existing: BudgetItem[]): string {
  const used = new Set(existing.map((b) => b.color))
  const fromDefaults = DEFAULT_BUDGET_TEMPLATES.map((t) => t.color).find((c) => !used.has(c))
  if (fromDefaults) return fromDefaults
  return EXTRA_COLORS.find((c) => !used.has(c)) ?? EXTRA_COLORS[existing.length % EXTRA_COLORS.length]
}
