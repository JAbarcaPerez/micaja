import { useEffect, useMemo, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDataStore } from '@/stores/dataStore'
import { formatCurrency } from '@/lib/format'
import {
  getBudgetLabel,
  getBudgetColor,
  remainingBudget,
  remainingToAllocate,
  budgetProgress,
  currentMonthKey,
} from '@/lib/budget'
import type { BudgetItem, BudgetKind } from '@/types'
import { Pencil, Plus, Wallet, Trash2 } from 'lucide-react'

export function BudgetPage() {
  const {
    budgets,
    accounts,
    ensureMonthBudgets,
    updateBudgetPlanned,
    allocateToBudget,
    addBudgetCategory,
    deleteBudgetCategory,
    getMainAccount,
  } = useDataStore()

  const [month, setMonth] = useState(currentMonthKey())
  const [editId, setEditId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [allocId, setAllocId] = useState<number | null>(null)
  const [allocValue, setAllocValue] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newKind, setNewKind] = useState<BudgetKind>('expense')
  const [newPlanned, setNewPlanned] = useState('')

  useEffect(() => {
    ensureMonthBudgets(month)
  }, [month, ensureMonthBudgets])

  const monthBudgets = useMemo(() => {
    const list = budgets.filter((b) => b.month === month)
    const map = new Map<string, BudgetItem>()
    for (const item of list) {
      const prev = map.get(item.rubro)
      if (!prev || (item.id ?? 0) > (prev.id ?? 0)) {
        map.set(item.rubro, item)
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      (a.name || a.rubro).localeCompare(b.name || b.rubro, 'es')
    )
  }, [budgets, month])

  const mainAccount = getMainAccount()
  const totalPlanned = monthBudgets.reduce((s, b) => s + b.plannedAmount, 0)
  const totalSpent = monthBudgets.reduce((s, b) => s + b.spentAmount, 0)
  const totalAllocated = monthBudgets.reduce((s, b) => s + b.allocatedAmount, 0)

  const handleSavePlanned = async (item: BudgetItem) => {
    setError('')
    setMessage('')
    const value = parseFloat(editValue)
    if (isNaN(value)) {
      setError('Monto inválido')
      return
    }
    const err = await updateBudgetPlanned(item.id!, value)
    if (err) {
      setError(err)
      return
    }
    setEditId(null)
    setMessage('Presupuesto actualizado')
  }

  const handleAllocate = async (item: BudgetItem) => {
    setError('')
    setMessage('')
    const value = parseFloat(allocValue)
    if (isNaN(value) || value <= 0) {
      setError('Monto inválido')
      return
    }
    const err = await allocateToBudget(item.id!, value)
    if (err) {
      setError(err)
      return
    }
    setAllocId(null)
    setAllocValue('')
    setMessage('Monto asignado al rubro correctamente')
  }

  const handleAddCategory = async () => {
    setError('')
    setMessage('')
    const planned = newPlanned ? parseFloat(newPlanned) : 0
    const err = await addBudgetCategory(month, newName, newKind, isNaN(planned) ? 0 : planned)
    if (err) {
      setError(err)
      return
    }
    setShowAdd(false)
    setNewName('')
    setNewPlanned('')
    setNewKind('expense')
    setMessage('Categoría de presupuesto agregada')
  }

  const handleDelete = async (item: BudgetItem) => {
    setError('')
    setMessage('')
    if (!confirm(`¿Eliminar la categoría "${getBudgetLabel(item)}"?`)) return
    const err = await deleteBudgetCategory(item.id!)
    if (err) {
      setError(err)
      return
    }
    setMessage('Categoría eliminada')
  }

  return (
    <div>
      <Header
        title="Presupuesto"
        description="Planifica y controla tus rubros de gasto y ahorro"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setShowAdd((v) => !v)
              setError('')
              setMessage('')
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nueva categoría
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="space-y-1">
          <Label htmlFor="budget-month">Mes</Label>
          <Input
            id="budget-month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-44"
          />
        </div>
        {mainAccount && (
          <Card className="flex-1 min-w-[200px]">
            <CardContent className="flex items-center gap-3 py-3">
              <Wallet className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Cuenta principal</p>
                <p className="font-semibold">
                  {mainAccount.name}: {formatCurrency(mainAccount.balance, mainAccount.currency)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showAdd && (
        <Card className="mb-6 border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Agregar categoría de presupuesto</CardTitle>
            <CardDescription>
              Crea un rubro personalizado para este mes (ej. Educación, Viajes, Salud…)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Educación"
                />
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={newKind} onValueChange={(v) => setNewKind(v as BudgetKind)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Gasto</SelectItem>
                    <SelectItem value="saving">Ahorro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Presupuesto inicial (opcional)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newPlanned}
                  onChange={(e) => setNewPlanned(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddCategory}>Guardar categoría</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Presupuesto total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(totalPlanned)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Asignado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(totalAllocated)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Gastado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-destructive">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {monthBudgets.map((item) => {
          const progress = budgetProgress(item)
          const remaining = remainingBudget(item)
          const canAllocate = remainingToAllocate(item)
          const color = getBudgetColor(item)

          return (
            <Card key={item.id ?? item.rubro}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {getBudgetLabel(item)}
                    </CardTitle>
                    <CardDescription>
                      {item.kind === 'saving' ? 'Ahorro' : 'Gasto'} · Disponible:{' '}
                      {formatCurrency(remaining)} de {formatCurrency(item.plannedAmount)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditId(item.id!)
                        setEditValue(item.plannedAmount.toString())
                        setAllocId(null)
                        setError('')
                        setMessage('')
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Gastado {formatCurrency(item.spentAmount)}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">Presupuesto</p>
                    <p className="font-medium">{formatCurrency(item.plannedAmount)}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground">Asignado</p>
                    <p className="font-medium">{formatCurrency(item.allocatedAmount)}</p>
                  </div>
                </div>

                {editId === item.id && (
                  <div className="space-y-2 rounded-lg border p-3">
                    <Label>Editar presupuesto del mes</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                      />
                      <Button onClick={() => handleSavePlanned(item)}>Guardar</Button>
                      <Button variant="outline" onClick={() => setEditId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {allocId === item.id ? (
                  <div className="space-y-2 rounded-lg border p-3">
                    <Label>Asignar saldo al rubro (máx. {formatCurrency(canAllocate)})</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={allocValue}
                        onChange={(e) => setAllocValue(e.target.value)}
                        placeholder="Monto"
                      />
                      <Button onClick={() => handleAllocate(item)}>Asignar</Button>
                      <Button variant="outline" onClick={() => setAllocId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={canAllocate <= 0}
                    onClick={() => {
                      setAllocId(item.id!)
                      setAllocValue('')
                      setEditId(null)
                      setError('')
                      setMessage('')
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Asignar saldo al rubro
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {monthBudgets.length === 0 && (
        <p className="text-center text-muted-foreground py-12">Cargando presupuestos del mes...</p>
      )}

      {accounts.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground text-center">
          Crea una cuenta (idealmente llamada &quot;Cuenta Principal&quot;) para usar el presupuesto.
        </p>
      )}
    </div>
  )
}
