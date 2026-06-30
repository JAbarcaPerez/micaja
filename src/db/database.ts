import Dexie, { type EntityTable } from 'dexie'
import type { Account, Category, Transaction, SavingsGoal, Loan, User } from '@/types'

export class MiCajaDB extends Dexie {
  accounts!: EntityTable<Account, 'id'>
  categories!: EntityTable<Category, 'id'>
  transactions!: EntityTable<Transaction, 'id'>
  savingsGoals!: EntityTable<SavingsGoal, 'id'>
  loans!: EntityTable<Loan, 'id'>
  users!: EntityTable<User, 'id'>

  constructor() {
    super('MiCajaDB')

    this.version(1).stores({
      accounts: '++id, name, type, isActive',
      categories: '++id, name, type, isActive',
      transactions: '++id, type, categoryId, accountId, date, loanId',
      savingsGoals: '++id, name, isCompleted, accountId',
      loans: '++id, personName, direction, status, accountId',
    })

    this.version(2).stores({
      users: '++id, &email',
    })
  }
}

export const db = new MiCajaDB()
