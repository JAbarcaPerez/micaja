import { db } from './database'
import { nowISO } from '@/lib/utils'
import type { Account, Category } from '@/types'

const defaultAccounts: Omit<Account, 'id'>[] = [
  {
    name: 'Efectivo',
    type: 'cash',
    balance: 0,
    currency: 'EUR',
    color: '#22c55e',
    icon: 'wallet',
    isActive: true,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    name: 'Cuenta Principal',
    type: 'bank',
    balance: 0,
    currency: 'EUR',
    color: '#3b82f6',
    icon: 'landmark',
    isActive: true,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
]

const defaultCategories: Omit<Category, 'id'>[] = [
  { name: 'Salario', type: 'income', color: '#22c55e', icon: 'briefcase', isActive: true, createdAt: nowISO() },
  { name: 'Freelance', type: 'income', color: '#10b981', icon: 'laptop', isActive: true, createdAt: nowISO() },
  { name: 'Otros ingresos', type: 'income', color: '#14b8a6', icon: 'plus-circle', isActive: true, createdAt: nowISO() },
  { name: 'Alimentación', type: 'expense', color: '#ef4444', icon: 'utensils', isActive: true, createdAt: nowISO() },
  { name: 'Transporte', type: 'expense', color: '#f97316', icon: 'car', isActive: true, createdAt: nowISO() },
  { name: 'Vivienda', type: 'expense', color: '#8b5cf6', icon: 'home', isActive: true, createdAt: nowISO() },
  { name: 'Entretenimiento', type: 'expense', color: '#ec4899', icon: 'gamepad-2', isActive: true, createdAt: nowISO() },
  { name: 'Salud', type: 'expense', color: '#06b6d4', icon: 'heart-pulse', isActive: true, createdAt: nowISO() },
  { name: 'Educación', type: 'expense', color: '#6366f1', icon: 'graduation-cap', isActive: true, createdAt: nowISO() },
  { name: 'Otros gastos', type: 'expense', color: '#64748b', icon: 'more-horizontal', isActive: true, createdAt: nowISO() },
  { name: 'Fondo de emergencia', type: 'saving', color: '#0ea5e9', icon: 'shield', isActive: true, createdAt: nowISO() },
  { name: 'Inversión', type: 'saving', color: '#a855f7', icon: 'trending-up', isActive: true, createdAt: nowISO() },
]

export async function seedDatabase(): Promise<void> {
  const accountCount = await db.accounts.count()
  if (accountCount === 0) {
    await db.accounts.bulkAdd(defaultAccounts)
  }

  const categoryCount = await db.categories.count()
  if (categoryCount === 0) {
    await db.categories.bulkAdd(defaultCategories)
  }
}

export async function resetDatabase(): Promise<void> {
  await db.transactions.clear()
  await db.savingsGoals.clear()
  await db.loans.clear()
  await db.categories.clear()
  await db.accounts.clear()
  await seedDatabase()
}
