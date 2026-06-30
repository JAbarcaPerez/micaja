import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useDataStore } from '@/stores/dataStore'
import { formatCurrency, getAccountTypeLabel } from '@/lib/format'
import type { Account, AccountType } from '@/types'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const accountTypes: AccountType[] = ['cash', 'bank', 'digital_wallet', 'savings']
const colors = ['#22c55e', '#3b82f6', '#8b5cf6', '#f97316', '#ec4899', '#06b6d4', '#ef4444']

export function AccountsPage() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useDataStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Account | undefined>()

  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('bank')
  const [balance, setBalance] = useState('0')
  const [color, setColor] = useState(colors[0])

  const resetForm = () => {
    setName('')
    setType('bank')
    setBalance('0')
    setColor(colors[0])
    setEditing(undefined)
  }

  const openEdit = (account: Account) => {
    setEditing(account)
    setName(account.name)
    setType(account.type)
    setBalance(account.balance.toString())
    setColor(account.color)
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name,
      type,
      balance: parseFloat(balance),
      currency: 'EUR',
      color,
      icon: 'wallet',
      isActive: true,
    }

    if (editing?.id) {
      await updateAccount(editing.id, data)
    } else {
      await addAccount(data)
    }
    setOpen(false)
    resetForm()
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar esta cuenta?')) {
      await deleteAccount(id)
    }
  }

  return (
    <div>
      <Header
        title="Cuentas"
        description="Gestiona tus cuentas de efectivo, bancos y billeteras"
        actions={
          <Button size="sm" onClick={() => { resetForm(); setOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva cuenta
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: account.color }}
                  >
                    {account.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{account.name}</h3>
                    <Badge variant="secondary" className="mt-1">
                      {getAccountTypeLabel(account.type)}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(account)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id!)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(account.balance)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar cuenta' : 'Nueva cuenta'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {accountTypes.map((t) => (
                    <SelectItem key={t} value={t}>{getAccountTypeLabel(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Saldo inicial</Label>
              <Input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 ${color === c ? 'border-foreground' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">{editing ? 'Guardar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
