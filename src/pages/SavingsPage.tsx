import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useDataStore } from '@/stores/dataStore'
import { formatCurrency, formatDate, formatPercent } from '@/lib/format'
import type { SavingsGoal } from '@/types'
import { Plus, Pencil, Trash2, Target } from 'lucide-react'

const colors = ['#0ea5e9', '#a855f7', '#22c55e', '#f97316', '#ec4899']

export function SavingsPage() {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useDataStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<SavingsGoal | undefined>()

  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('0')
  const [deadline, setDeadline] = useState('')
  const [color, setColor] = useState(colors[0])

  const resetForm = () => {
    setName('')
    setTargetAmount('')
    setCurrentAmount('0')
    setDeadline('')
    setColor(colors[0])
    setEditing(undefined)
  }

  const openEdit = (goal: SavingsGoal) => {
    setEditing(goal)
    setName(goal.name)
    setTargetAmount(goal.targetAmount.toString())
    setCurrentAmount(goal.currentAmount.toString())
    setDeadline(goal.deadline?.slice(0, 10) ?? '')
    setColor(goal.color)
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const target = parseFloat(targetAmount)
    const current = parseFloat(currentAmount)
    const data = {
      name,
      targetAmount: target,
      currentAmount: current,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      color,
      icon: 'target',
      isCompleted: current >= target,
    }

    if (editing?.id) {
      await updateSavingsGoal(editing.id, data)
    } else {
      await addSavingsGoal(data)
    }
    setOpen(false)
    resetForm()
  }

  return (
    <div>
      <Header
        title="Objetivos de ahorro"
        description="Define metas y sigue tu progreso"
        actions={
          <Button size="sm" onClick={() => { resetForm(); setOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo objetivo
          </Button>
        }
      />

      {savingsGoals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Target className="h-12 w-12 mb-4 opacity-50" />
            <p>No tienes objetivos de ahorro aún</p>
            <Button className="mt-4" onClick={() => { resetForm(); setOpen(true) }}>
              Crear primer objetivo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {savingsGoals.map((goal) => {
            const progress = goal.targetAmount > 0
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              : 0

            return (
              <Card key={goal.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: goal.color }}
                      >
                        <Target className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{goal.name}</h3>
                        {goal.isCompleted && <Badge variant="success">Completado</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(goal)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteSavingsGoal(goal.id!)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{formatCurrency(goal.currentAmount)}</span>
                      <span className="text-muted-foreground">{formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatPercent(goal.currentAmount, goal.targetAmount)} completado</span>
                      {goal.deadline && <span>Meta: {formatDate(goal.deadline)}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar objetivo' : 'Nuevo objetivo de ahorro'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Meta</Label>
                <Input type="number" step="0.01" required value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Actual</Label>
                <Input type="number" step="0.01" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fecha límite (opcional)</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
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
