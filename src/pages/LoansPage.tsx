import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { useDataStore } from '@/stores/dataStore'
import { formatCurrency, formatDate, getLoanStatusLabel, getLoanDirectionLabel } from '@/lib/format'
import type { Loan, LoanDirection, LoanStatus } from '@/types'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const statuses: LoanStatus[] = ['active', 'paid', 'overdue', 'cancelled']

const statusVariant: Record<LoanStatus, 'default' | 'success' | 'destructive' | 'warning' | 'secondary'> = {
  active: 'default',
  paid: 'success',
  overdue: 'destructive',
  cancelled: 'secondary',
}

export function LoansPage() {
  const { loans, addLoan, updateLoan, deleteLoan } = useDataStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Loan | undefined>()
  const [activeTab, setActiveTab] = useState<'all' | LoanStatus>('all')

  const [personName, setPersonName] = useState('')
  const [direction, setDirection] = useState<LoanDirection>('lent')
  const [principalAmount, setPrincipalAmount] = useState('')
  const [paidAmount, setPaidAmount] = useState('0')
  const [status, setStatus] = useState<LoanStatus>('active')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')

  const filtered = activeTab === 'all' ? loans : loans.filter((l) => l.status === activeTab)

  const resetForm = () => {
    setPersonName('')
    setDirection('lent')
    setPrincipalAmount('')
    setPaidAmount('0')
    setStatus('active')
    setStartDate(new Date().toISOString().slice(0, 10))
    setDueDate('')
    setDescription('')
    setEditing(undefined)
  }

  const openEdit = (loan: Loan) => {
    setEditing(loan)
    setPersonName(loan.personName)
    setDirection(loan.direction)
    setPrincipalAmount(loan.principalAmount.toString())
    setPaidAmount(loan.paidAmount.toString())
    setStatus(loan.status)
    setStartDate(loan.startDate.slice(0, 10))
    setDueDate(loan.dueDate?.slice(0, 10) ?? '')
    setDescription(loan.description ?? '')
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      personName,
      direction,
      principalAmount: parseFloat(principalAmount),
      paidAmount: parseFloat(paidAmount),
      status,
      startDate: new Date(startDate).toISOString(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      description: description || undefined,
    }

    if (editing?.id) {
      await updateLoan(editing.id, data)
    } else {
      await addLoan(data)
    }
    setOpen(false)
    resetForm()
  }

  return (
    <div>
      <Header
        title="Préstamos"
        description="Gestiona préstamos prestados y recibidos"
        actions={
          <Button size="sm" onClick={() => { resetForm(); setOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo préstamo
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="active">Activos</TabsTrigger>
          <TabsTrigger value="paid">Pagados</TabsTrigger>
          <TabsTrigger value="overdue">Vencidos</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No hay préstamos en esta categoría
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((loan) => {
                const pending = loan.principalAmount - loan.paidAmount
                const progress = loan.principalAmount > 0
                  ? (loan.paidAmount / loan.principalAmount) * 100
                  : 0

                return (
                  <Card key={loan.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{loan.personName}</h3>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{getLoanDirectionLabel(loan.direction)}</Badge>
                            <Badge variant={statusVariant[loan.status]}>
                              {getLoanStatusLabel(loan.status)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(loan)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteLoan(loan.id!)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Pagado: {formatCurrency(loan.paidAmount)}</span>
                          <span className="font-semibold text-destructive">
                            Pendiente: {formatCurrency(pending)}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Total: {formatCurrency(loan.principalAmount)}</span>
                          {loan.dueDate && <span>Vence: {formatDate(loan.dueDate)}</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar préstamo' : 'Nuevo préstamo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Persona</Label>
              <Input required value={personName} onChange={(e) => setPersonName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Select value={direction} onValueChange={(v) => setDirection(v as LoanDirection)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lent">Prestado</SelectItem>
                    <SelectItem value="borrowed">Recibido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as LoanStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>{getLoanStatusLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto principal</Label>
                <Input type="number" step="0.01" required value={principalAmount} onChange={(e) => setPrincipalAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Pagado</Label>
                <Input type="number" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha inicio</Label>
                <Input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fecha vencimiento</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
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
