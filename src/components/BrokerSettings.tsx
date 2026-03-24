import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useBrokers } from '@/contexts/BrokerContext'
import { Broker } from '@/types'

export function BrokerSettings() {
  const { brokers, addBroker, updateBroker, deleteBroker } = useBrokers()

  const handleAdd = () => {
    addBroker({
      id: crypto.randomUUID(),
      role: 'Corretor',
      name: '',
      level: 'Júnior',
      percentage: 0,
    })
    toast({ title: 'Adicionado', description: 'Novo colaborador adicionado à lista.' })
  }

  const handleDelete = (id: string) => {
    deleteBroker(id)
    toast({ title: 'Removido', description: 'Colaborador removido com sucesso.' })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="shadow-md border-blue-100/50">
        <CardHeader className="bg-gradient-to-r from-white to-blue-50/30 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Lista de Corretores / Colaboradores</CardTitle>
            <CardDescription>
              Gerencie a equipe, definindo cargos, níveis e porcentagens. As alterações são salvas
              automaticamente ao sair do campo.
            </CardDescription>
          </div>
          <Button onClick={handleAdd} className="gap-2 shrink-0 self-start sm:self-auto">
            <Plus className="w-4 h-4" /> <span>Adicionar</span>
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-sm font-medium text-muted-foreground">
              <div className="col-span-3">Cargo</div>
              <div className="col-span-4">Nome do Colaborador</div>
              <div className="col-span-2">Nível</div>
              <div className="col-span-2">Porcentagem (%)</div>
              <div className="col-span-1 text-center">Ações</div>
            </div>

            {brokers.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-slate-50/50 rounded-lg border border-dashed">
                Nenhum colaborador cadastrado.
              </div>
            ) : (
              <div className="space-y-3">
                {brokers.map((broker) => (
                  <CollaboratorRow
                    key={broker.id}
                    broker={broker}
                    onUpdate={updateBroker}
                    onDelete={() => handleDelete(broker.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CollaboratorRow({
  broker,
  onUpdate,
  onDelete,
}: {
  broker: Broker
  onUpdate: (b: Broker) => void
  onDelete: () => void
}) {
  const [localBroker, setLocalBroker] = useState(broker)
  const [percentageStr, setPercentageStr] = useState(broker.percentage.toString())

  useEffect(() => {
    setLocalBroker(broker)
    setPercentageStr(broker.percentage.toString())
  }, [broker])

  const handleChange = (field: keyof Broker, value: any) => {
    const updated = { ...localBroker, [field]: value }

    // Conditional level logic
    if (field === 'role' && value !== 'Corretor') {
      updated.level = ''
    } else if (field === 'role' && value === 'Corretor' && !updated.level) {
      updated.level = 'Júnior'
    }

    setLocalBroker(updated)

    // Selects should auto-save immediately
    if (field === 'role' || field === 'level') {
      let finalPercentage = parseFloat(percentageStr)
      if (isNaN(finalPercentage)) finalPercentage = 0
      updated.percentage = finalPercentage
      onUpdate(updated)
    }
  }

  const handleBlur = () => {
    let finalPercentage = parseFloat(percentageStr)
    if (isNaN(finalPercentage)) finalPercentage = 0

    const updated = { ...localBroker, percentage: finalPercentage }
    if (JSON.stringify(updated) !== JSON.stringify(broker)) {
      onUpdate(updated)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 md:p-2 bg-white border rounded-lg md:border-transparent md:bg-transparent transition-colors hover:bg-slate-50/50 group">
      <div className="col-span-3 space-y-1.5 md:space-y-0">
        <label className="text-xs font-medium md:hidden text-muted-foreground">Cargo</label>
        <Select
          value={localBroker.role || 'Corretor'}
          onValueChange={(v) => handleChange('role', v)}
        >
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Corretor">Corretor</SelectItem>
            <SelectItem value="Gerente de Equipe">Gerente de Equipe</SelectItem>
            <SelectItem value="Gerente Geral">Gerente Geral</SelectItem>
            <SelectItem value="Apoio">Apoio</SelectItem>
            <SelectItem value="Captador">Captador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-4 space-y-1.5 md:space-y-0">
        <label className="text-xs font-medium md:hidden text-muted-foreground">
          Nome do Colaborador
        </label>
        <Input
          value={localBroker.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={handleBlur}
          placeholder="Ex: João Silva"
          className="bg-white"
        />
      </div>

      <div className="col-span-2 space-y-1.5 md:space-y-0">
        <label className="text-xs font-medium md:hidden text-muted-foreground">Nível</label>
        {!localBroker.role || localBroker.role === 'Corretor' ? (
          <Select
            value={localBroker.level || 'Júnior'}
            onValueChange={(v) => handleChange('level', v)}
          >
            <SelectTrigger className="bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Júnior">Júnior</SelectItem>
              <SelectItem value="Pleno">Pleno</SelectItem>
              <SelectItem value="Sênior">Sênior</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="h-10 w-full rounded-md border border-input bg-slate-50/50 px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed flex items-center">
            N/A
          </div>
        )}
      </div>

      <div className="col-span-2 space-y-1.5 md:space-y-0">
        <label className="text-xs font-medium md:hidden text-muted-foreground">
          Porcentagem (%)
        </label>
        <Input
          type="number"
          step="0.01"
          value={percentageStr}
          onChange={(e) => setPercentageStr(e.target.value)}
          onBlur={handleBlur}
          placeholder="0"
          className="bg-white"
        />
      </div>

      <div className="col-span-1 flex justify-end md:justify-center mt-2 md:mt-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
          title="Remover Colaborador"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
