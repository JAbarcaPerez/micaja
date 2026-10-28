import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useDataStore } from '@/stores/dataStore'
import { getTransactionTypeLabel } from '@/lib/format'
import { filterBudgetsForType, remainingAllocated, currentMonthKey, getBudgetLabel } from '@/lib/budget'
import type { Transaction, TransactionType, BudgetRubro } from '@/types'

const transactionTypes: TransactionType[] = ['income', 'expense', 'saving', 'loan_payment', 'loan_received']

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction
}

export function TransactionForm({ open, onOpenChange, transaction }: TransactionFormProps) {
  const { categories, accounts, loans, budgets, addTransaction, updateTransaction } = useDataStore()
  const isEditing = !!transaction

  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? '')
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [categoryId, setCategoryId] = useState(transaction?.categoryId?.toString() ?? '')
  const [accountId, setAccountId] = useState(transaction?.accountId?.toString() ?? '')
  const [date, setDate] = useState(transaction?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState(transaction?.notes ?? '')
  const [loanId, setLoanId] = useState(transaction?.loanId?.toString() ?? '')
  const [budgetRubro, setBudgetRubro] = useState<string>(transaction?.budgetRubro ?? '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Pago/cobro de préstamo usa categorías de tipo gasto (ej. "Préstamos")
  const filteredCategories = categories.filter((c) => {
    if (!c.isActive) return false
    if (type === 'loan_payment' || type === 'loan_received') {
      return c.type === 'expense'
    }
    return c.type === type
  })
  const activeAccounts = accounts.filter((a) => a.isActive)
  const activeLoans = loans.filter((l) => l.status === 'active')

  const month = (date || '').slice(0, 7) || currentMonthKey()
  const monthBudgets = budgets.filter((b) => b.month === month)
  const availableBudgets = filterBudgetsForType(monthBudgets, type)
  // Préstamos no usan rubro de presupuesto; sí requieren seleccionar el préstamo
  const needsBudget = type === 'expense' || type === 'saving'
  const needsLoan = type === 'loan_payment' || type === 'loan_received'

  useEffect(() => {
    if (!needsBudget) setBudgetRubro('')
  }, [type, needsBudget])

  // Al elegir pago de préstamo, preseleccionar categoría "Préstamos" si existe
  useEffect(() => {
    if (type === 'loan_payment' || type === 'loan_received') {
      const prestamos = categories.find(
        (c) => c.isActive && c.type === 'expense' && c.name.toLowerCase() === 'préstamos'
      ) || categories.find(
        (c) => c.isActive && c.type === 'expense' && c.name.toLowerCase() === 'prestamos'
      )
      if (prestamos?.id) {
        setCategoryId(String(prestamos.id))
      }
    }
  }, [type, categories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const data = {
      type,
      amount: parseFloat(amount),
      description,
      categoryId: parseInt(categoryId),
      accountId: parseInt(accountId),
      date: date,
      notes: notes || undefined,
      loanId: loanId ? parseInt(loanId) : undefined,
      budgetRubro: needsBudget && budgetRubro ? (budgetRubro as BudgetRubro) : undefined,
    }

    if (needsBudget && !budgetRubro) {
      setError('Selecciona un rubro del presupuesto con saldo asignado')
      setLoading(false)
      return
    }

    if (needsLoan && !loanId) {
      setError('Selecciona el préstamo específico que estás pagando')
      setLoading(false)
      return
    }

    let err: string | null = null
    if (isEditing && transaction?.id) {
      err = await updateTransaction(transaction.id, data)
    } else {
      err = await addTransaction(data)
    }

    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar movimiento' : 'Nuevo movimiento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transactionTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {getTransactionTypeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input required value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id!.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cuenta</Label>
              <Select value={accountId} onValueChange={setAccountId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id!.toString()}>
                      {a.name} ({a.balance.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {needsBudget && (
            <div className="space-y-2">
              <Label>Rubro del presupuesto</Label>
              <Select value={budgetRubro} onValueChange={setBudgetRubro} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rubro" />
                </SelectTrigger>
                <SelectContent>
                  {availableBudgets.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      Sin rubros — créalos en Presupuesto
                    </SelectItem>
                  ) : (
                    availableBudgets.map((b) => (
                      <SelectItem key={b.id ?? b.rubro} value={b.rubro}>
                        {getBudgetLabel(b)} (asignado disp. {remainingAllocated(b).toFixed(2)})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                El gasto se descuenta del presupuesto del rubro y del saldo de la cuenta.
              </p>
            </div>
          )}

          {needsLoan && (
            <div className="space-y-2">
              <Label>Préstamo a pagar</Label>
              <Select value={loanId} onValueChange={setLoanId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar préstamo" />
                </SelectTrigger>
                <SelectContent>
                  {activeLoans.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No hay préstamos activos
                    </SelectItem>
                  ) : (
                    activeLoans.map((l) => {
                      const total = l.totalInstallments ?? 0
                      const paid = l.paidInstallments ?? 0
                      const left = Math.max(0, total - paid)
                      return (
                        <SelectItem key={l.id} value={l.id!.toString()}>
                          {l.personName}
                          {total > 0 ? ` · cuotas restantes: ${left}/${total}` : ''}
                          {` · pendiente: ${(l.principalAmount - l.paidAmount).toFixed(2)}`}
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Al registrar el pago se descontará 1 cuota del préstamo seleccionado.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {isEditing ? 'Guardar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
