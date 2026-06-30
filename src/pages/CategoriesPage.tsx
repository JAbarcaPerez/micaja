import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
import { getTransactionTypeLabel } from '@/lib/format'
import type { Category, TransactionType } from '@/types'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const categoryTypes: TransactionType[] = ['income', 'expense', 'saving']
const colors = ['#22c55e', '#3b82f6', '#8b5cf6', '#f97316', '#ec4899', '#06b6d4', '#ef4444', '#64748b']

export function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useDataStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | undefined>()
  const [activeTab, setActiveTab] = useState<TransactionType>('expense')

  const [name, setName] = useState('')
  const [type, setType] = useState<TransactionType>('expense')
  const [color, setColor] = useState(colors[0])

  const filtered = categories.filter((c) => c.type === activeTab)

  const resetForm = () => {
    setName('')
    setType(activeTab)
    setColor(colors[0])
    setEditing(undefined)
  }

  const openEdit = (category: Category) => {
    setEditing(category)
    setName(category.name)
    setType(category.type)
    setColor(category.color)
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { name, type, color, icon: 'tag', isActive: true }

    if (editing?.id) {
      await updateCategory(editing.id, data)
    } else {
      await addCategory(data)
    }
    setOpen(false)
    resetForm()
  }

  return (
    <div>
      <Header
        title="Categorías"
        description="Personaliza las categorías de tus movimientos"
        actions={
          <Button size="sm" onClick={() => { resetForm(); setOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva categoría
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TransactionType)}>
        <TabsList>
          {categoryTypes.map((t) => (
            <TabsTrigger key={t} value={t}>{getTransactionTypeLabel(t)}</TabsTrigger>
          ))}
        </TabsList>

        {categoryTypes.map((tabType) => (
          <TabsContent key={tabType} value={tabType}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-4">
              {filtered.map((category) => (
                <Card key={category.id}>
                  <CardContent className="flex items-center justify-between pt-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <Badge variant={category.isActive ? 'success' : 'secondary'}>
                          {category.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteCategory(category.id!)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoryTypes.map((t) => (
                    <SelectItem key={t} value={t}>{getTransactionTypeLabel(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
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
