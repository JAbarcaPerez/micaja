import { db } from './database'
import { nowISO } from '@/lib/utils'
import { subMonths, subDays, format } from 'date-fns'

function dateISO(daysAgo: number): string {
  return subDays(new Date(), daysAgo).toISOString()
}

function monthDate(monthsAgo: number, day: number): string {
  const d = subMonths(new Date(), monthsAgo)
  d.setDate(day)
  return d.toISOString()
}

export async function seedDemoData(): Promise<void> {
  await db.transaction('rw', [
    db.accounts,
    db.categories,
    db.transactions,
    db.savingsGoals,
    db.loans,
  ], async () => {
    await db.transactions.clear()
    await db.savingsGoals.clear()
    await db.loans.clear()
    await db.accounts.clear()

    const categories = await db.categories.toArray()
    const cat = (name: string) => categories.find((c) => c.name === name)!

    const cashId = (await db.accounts.add({
      name: 'Efectivo',
      type: 'cash',
      balance: 350,
      currency: 'EUR',
      color: '#22c55e',
      icon: 'wallet',
      isActive: true,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })) as number

    const bankId = (await db.accounts.add({
      name: 'Cuenta Principal',
      type: 'bank',
      balance: 4250.75,
      currency: 'EUR',
      color: '#3b82f6',
      icon: 'landmark',
      isActive: true,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })) as number

    const walletId = (await db.accounts.add({
      name: 'Bizum / Revolut',
      type: 'digital_wallet',
      balance: 180.5,
      currency: 'EUR',
      color: '#8b5cf6',
      icon: 'smartphone',
      isActive: true,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })) as number

    const savingsId = (await db.accounts.add({
      name: 'Cuenta Ahorro',
      type: 'savings',
      balance: 3200,
      currency: 'EUR',
      color: '#0ea5e9',
      icon: 'piggy-bank',
      isActive: true,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })) as number

    const transactions = [
      { type: 'income' as const, amount: 2400, description: 'Salario mensual', categoryId: cat('Salario').id!, accountId: bankId, date: monthDate(0, 1) },
      { type: 'income' as const, amount: 2400, description: 'Salario mensual', categoryId: cat('Salario').id!, accountId: bankId, date: monthDate(1, 1) },
      { type: 'income' as const, amount: 2400, description: 'Salario mensual', categoryId: cat('Salario').id!, accountId: bankId, date: monthDate(2, 1) },
      { type: 'income' as const, amount: 450, description: 'Proyecto freelance web', categoryId: cat('Freelance').id!, accountId: bankId, date: dateISO(18) },
      { type: 'income' as const, amount: 120, description: 'Venta artículos', categoryId: cat('Otros ingresos').id!, accountId: walletId, date: dateISO(8) },

      { type: 'expense' as const, amount: 850, description: 'Alquiler vivienda', categoryId: cat('Vivienda').id!, accountId: bankId, date: monthDate(0, 3) },
      { type: 'expense' as const, amount: 850, description: 'Alquiler vivienda', categoryId: cat('Vivienda').id!, accountId: bankId, date: monthDate(1, 3) },
      { type: 'expense' as const, amount: 850, description: 'Alquiler vivienda', categoryId: cat('Vivienda').id!, accountId: bankId, date: monthDate(2, 3) },
      { type: 'expense' as const, amount: 320, description: 'Supermercado semanal', categoryId: cat('Alimentación').id!, accountId: bankId, date: dateISO(2) },
      { type: 'expense' as const, amount: 285, description: 'Compra supermercado', categoryId: cat('Alimentación').id!, accountId: bankId, date: dateISO(9) },
      { type: 'expense' as const, amount: 156, description: 'Restaurante fin de semana', categoryId: cat('Alimentación').id!, accountId: walletId, date: dateISO(5) },
      { type: 'expense' as const, amount: 45, description: 'Gasolina', categoryId: cat('Transporte').id!, accountId: cashId, date: dateISO(4) },
      { type: 'expense' as const, amount: 89, description: 'Abono transporte público', categoryId: cat('Transporte').id!, accountId: bankId, date: monthDate(0, 5) },
      { type: 'expense' as const, amount: 15.99, description: 'Netflix', categoryId: cat('Entretenimiento').id!, accountId: bankId, date: dateISO(12) },
      { type: 'expense' as const, amount: 42, description: 'Cine con amigos', categoryId: cat('Entretenimiento').id!, accountId: walletId, date: dateISO(15) },
      { type: 'expense' as const, amount: 65, description: 'Farmacia', categoryId: cat('Salud').id!, accountId: cashId, date: dateISO(7) },
      { type: 'expense' as const, amount: 29.99, description: 'Libro programación', categoryId: cat('Educación').id!, accountId: bankId, date: dateISO(20) },
      { type: 'expense' as const, amount: 18.5, description: 'Cafetería', categoryId: cat('Otros gastos').id!, accountId: cashId, date: dateISO(1) },

      { type: 'saving' as const, amount: 300, description: 'Aporte fondo emergencia', categoryId: cat('Fondo de emergencia').id!, accountId: savingsId, date: monthDate(0, 10) },
      { type: 'saving' as const, amount: 300, description: 'Aporte fondo emergencia', categoryId: cat('Fondo de emergencia').id!, accountId: savingsId, date: monthDate(1, 10) },
      { type: 'saving' as const, amount: 200, description: 'Inversión ETF', categoryId: cat('Inversión').id!, accountId: savingsId, date: dateISO(14) },
    ]

    for (const tx of transactions) {
      await db.transactions.add({
        ...tx,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      })
    }

    await db.savingsGoals.bulkAdd([
      {
        name: 'Vacaciones verano',
        targetAmount: 1500,
        currentAmount: 680,
        deadline: format(subMonths(new Date(), -4), "yyyy-MM-dd'T'00:00:00.000'Z'"),
        color: '#0ea5e9',
        icon: 'plane',
        accountId: savingsId,
        isCompleted: false,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
      {
        name: 'Fondo de emergencia',
        targetAmount: 5000,
        currentAmount: 3200,
        color: '#22c55e',
        icon: 'shield',
        accountId: savingsId,
        isCompleted: false,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
      {
        name: 'Portátil nuevo',
        targetAmount: 1200,
        currentAmount: 1200,
        color: '#a855f7',
        icon: 'laptop',
        isCompleted: true,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    ])

    const loan1Id = (await db.loans.add({
      personName: 'Carlos Méndez',
      direction: 'lent',
      principalAmount: 500,
      paidAmount: 200,
      status: 'active',
      startDate: dateISO(45),
      dueDate: dateISO(-30),
      description: 'Préstamo personal',
      accountId: bankId,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })) as number

    await db.loans.add({
      personName: 'María López',
      direction: 'borrowed',
      principalAmount: 300,
      paidAmount: 300,
      status: 'paid',
      startDate: dateISO(90),
      dueDate: dateISO(30),
      description: 'Préstamo pagado',
      accountId: walletId,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })

    await db.loans.add({
      personName: 'Pedro Ruiz',
      direction: 'lent',
      principalAmount: 150,
      paidAmount: 50,
      status: 'overdue',
      startDate: dateISO(120),
      dueDate: dateISO(10),
      description: 'Préstamo vencido',
      accountId: cashId,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })

    await db.transactions.add({
      type: 'loan_payment',
      amount: 200,
      description: 'Pago parcial préstamo Carlos',
      categoryId: cat('Otros ingresos').id!,
      accountId: bankId,
      date: dateISO(20),
      loanId: loan1Id,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    })
  })
}
