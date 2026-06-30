import { useState } from 'react'
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
import type { Transaction, TransactionType } from '@/types'

const transactionTypes: TransactionType[] = ['income', 'expense', 'saving', 'loan_payment', 'loan_received']

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction
}

export function TransactionForm({ open, onOpenChange, transaction }: TransactionFormProps) {
  const { categories, accounts, loans, addTransaction, updateTransaction } = useDataStore()
  const isEditing = !!transaction

  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? '')
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [categoryId, setCategoryId] = useState(transaction?.categoryId?.toString() ?? '')
  const [accountId, setAccountId] = useState(transaction?.accountId?.toString() ?? '')
  const [date, setDate] = useState(transaction?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState(transaction?.notes ?? '')
  const [loanId, setLoanId] = useState(transaction?.loanId?.toString() ?? '')

  const filteredCategories = categories.filter((c) => c.isActive && c.type === type)
  const activeAccounts = accounts.filter((a) => a.isActive)
  const activeLoans = loans.filter((l) => l.status === 'active')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      type,
      amount: parseFloat(amount),
      description,
      categoryId: parseInt(categoryId),
      accountId: parseInt(accountId),
      date: new Date(date).toISOString(),
      notes: notes || undefined,
      loanId: loanId ? parseInt(loanId) : undefined,
    }

    if (isEditing && transaction?.id) {
      await updateTransaction(transaction.id, data)
    } else {
      await addTransaction(data)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(type === 'loan_payment' || type === 'loan_received') && (
            <div className="space-y-2">
              <Label>Préstamo</Label>
              <Select value={loanId} onValueChange={setLoanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar préstamo" />
                </SelectTrigger>
                <SelectContent>
                  {activeLoans.map((l) => (
                    <SelectItem key={l.id} value={l.id!.toString()}>
                      {l.personName} - {l.direction === 'lent' ? 'Prestado' : 'Recibido'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEditing ? 'Guardar' : 'Registrar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
