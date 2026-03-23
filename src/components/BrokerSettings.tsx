import { useState, FormEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Edit2, Trash2, Plus, Save, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useBrokers } from '@/contexts/BrokerContext'
import { Broker, BrokerLevel } from '@/types'

export function BrokerSettings() {
  const { brokers, addBroker, updateBroker, deleteBroker } = useBrokers()
  const [editingId, setEditingId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [level, setLevel] = useState<string>('')
  const [percentage, setPercentage] = useState<string>('')

  const resetForm = () => {
    setName('')
    setLevel('')
    setPercentage('')
    setEditingId(null)
  }

  const handleEdit = (broker: Broker) => {
    setEditingId(broker.id)
    setName(broker.name)
    setLevel(broker.level)
    setPercentage(broker.percentage.toString())
  }

  const handleDelete = (id: string) => {
    deleteBroker(id)
    toast({ title: 'Excluído', description: 'Corretor removido com sucesso.' })
  }

  const handleSave = (e: FormEvent) => {
    e.preventDefault()
    if (!name || !level || !percentage) {
      toast({ title: 'Atenção', description: 'Preencha todos os campos.', variant: 'destructive' })
      return
    }

    const newBroker: Broker = {
      id: editingId || crypto.randomUUID(),
      name,
      level: level as BrokerLevel,
      percentage: Number(percentage),
    }

    if (editingId) {
      updateBroker(newBroker)
      toast({ title: 'Sucesso', description: 'Corretor atualizado com sucesso.' })
    } else {
      addBroker(newBroker)
      toast({ title: 'Sucesso', description: 'Corretor adicionado com sucesso.' })
    }

    resetForm()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="shadow-md border-blue-100/50">
        <CardHeader className="bg-gradient-to-r from-white to-blue-50/30 pb-4">
          <CardTitle>{editingId ? 'Editar Corretor' : 'Adicionar Corretor'}</CardTitle>
          <CardDescription>
            {editingId
              ? 'Modifique os dados do corretor selecionado.'
              : 'Cadastre um novo corretor e defina sua comissão padrão.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Mendes"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Nível</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="level" className="bg-white">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Júnior">Júnior</SelectItem>
                  <SelectItem value="Pleno">Pleno</SelectItem>
                  <SelectItem value="Sênior">Sênior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentage">Porcentagem (%)</Label>
              <Input
                id="percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="Ex: 38"
                className="bg-white"
              />
            </div>
            <div className="md:col-span-4 flex justify-end gap-2 pt-2">
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} className="gap-2">
                  <X className="w-4 h-4" /> Cancelar
                </Button>
              )}
              <Button type="submit" className="gap-2">
                {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? 'Salvar Alterações' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-md border-blue-100/50">
        <CardHeader className="bg-gradient-to-r from-white to-blue-50/30 pb-4">
          <CardTitle>Lista de Corretores</CardTitle>
          <CardDescription>Gerencie os corretores cadastrados no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {brokers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhum corretor cadastrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Porcentagem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brokers.map((broker) => (
                  <TableRow key={broker.id}>
                    <TableCell className="font-medium text-slate-800">{broker.name}</TableCell>
                    <TableCell>{broker.level}</TableCell>
                    <TableCell>{broker.percentage}%</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(broker)}
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(broker.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
