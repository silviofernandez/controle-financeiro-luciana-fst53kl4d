import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTransactions } from '@/contexts/TransactionContext'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, CheckCircle2, Trash2, AlertTriangle, Info } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { CATEGORIES, UNIDADES, Transaction, Unidade } from '@/types'
import { PreviewItem, TriageAction } from './types'
import { getMappings, saveMapping } from '@/services/establishment_mappings'
import { useAuth } from '@/contexts/AuthContext'

interface ImportPreviewProps {
  items: PreviewItem[]
  onBack: () => void
  onComplete: () => void
}

export function ImportPreview({ items, onBack, onComplete }: ImportPreviewProps) {
  const { transactions, addTransactions } = useTransactions()
  const { user } = useAuth()
  const [localItems, setLocalItems] = useState<PreviewItem[]>(items)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getMappings().then((mappings) => {
      setLocalItems((prev) =>
        prev.map((p) => {
          let updated = { ...p }
          const match = mappings.find((m) =>
            p.description.toLowerCase().includes(m.name.toLowerCase()),
          )
          if (match) {
            updated.triageAction = match.last_triage_type
            updated.category = match.suggested_category || p.category
          }

          const itemDate = new Date(updated.date).getTime()
          updated.isDuplicate = transactions.some((t) => {
            if (t.valor !== updated.value) return false
            const tDate = new Date(t.data).getTime()
            const diffDays = Math.abs(tDate - itemDate) / (1000 * 60 * 60 * 24)
            return diffDays <= 3
          })

          if (updated.triageAction === 'Dividir' && !updated.splitEmpresaValue) {
            updated.splitEmpresaValue = updated.value / 2
            updated.splitProlaboreValue = updated.value / 2
          }

          return updated
        }),
      )
    })
  }, [transactions, items])

  const handleUpdate = (id: string, field: keyof PreviewItem, value: any) => {
    setLocalItems((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, [field]: value }
          if (field === 'triageAction' && value === 'Dividir' && !updated.splitEmpresaValue) {
            updated.splitEmpresaValue = updated.value / 2
            updated.splitProlaboreValue = updated.value / 2
          }
          return updated
        }
        return p
      }),
    )
  }

  const handleDelete = (id: string) => setLocalItems((prev) => prev.filter((p) => p.id !== id))

  const hasUnassigned = localItems.some((i) => i.triageAction === null)
  const hasUnresolvedDuplicates = localItems.some(
    (i) =>
      i.isDuplicate &&
      !i.duplicateOverride &&
      i.triageAction !== 'Já lançado' &&
      i.triageAction !== null,
  )

  const handleConfirm = async () => {
    if (hasUnassigned) {
      toast({
        title: 'Atenção',
        description: 'Realize a triagem de todos os itens.',
        variant: 'destructive',
      })
      return
    }
    if (hasUnresolvedDuplicates) {
      toast({
        title: 'Atenção',
        description: 'Resolva os alertas de duplicidade.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    const toAdd: Omit<Transaction, 'id' | 'created_at'>[] = []
    const uniqueMappings = new Map<string, any>()

    localItems.forEach((p) => {
      if (p.triageAction === 'Já lançado' || !p.triageAction) return

      if (p.triageAction === 'Empresa') {
        toAdd.push({
          descricao: p.description,
          valor: p.value,
          data: p.date,
          unidade: p.unit,
          banco: p.bank,
          tipo: p.pbType === 'Receita' ? 'receita' : 'despesa',
          classificacao:
            p.pbType === 'Despesa Fixa'
              ? 'fixo'
              : p.pbType === 'Despesa Variável'
                ? 'variavel'
                : null,
          categoria: p.category,
          isCheckpoint: p.isCheckpoint,
        })
      } else if (p.triageAction === 'Pró-labore') {
        toAdd.push({
          descricao: `Pró-labore - ${p.description}`,
          valor: p.value,
          data: p.date,
          unidade: p.unit,
          banco: p.bank,
          tipo: 'despesa',
          classificacao: 'fixo',
          categoria: 'Folha - Administrativo',
        })
      } else if (p.triageAction === 'Dividir') {
        if (p.splitEmpresaValue && p.splitEmpresaValue > 0) {
          toAdd.push({
            descricao: p.description,
            valor: p.splitEmpresaValue,
            data: p.date,
            unidade: p.unit,
            banco: p.bank,
            tipo: p.pbType === 'Receita' ? 'receita' : 'despesa',
            classificacao:
              p.pbType === 'Despesa Fixa'
                ? 'fixo'
                : p.pbType === 'Despesa Variável'
                  ? 'variavel'
                  : null,
            categoria: p.category,
          })
        }
        if (p.splitProlaboreValue && p.splitProlaboreValue > 0) {
          toAdd.push({
            descricao: `Pró-labore - ${p.description}`,
            valor: p.splitProlaboreValue,
            data: p.date,
            unidade: p.unit,
            banco: p.bank,
            tipo: 'despesa',
            classificacao: 'fixo',
            categoria: 'Folha - Administrativo',
          })
        }
      }

      if (user) {
        uniqueMappings.set(p.description, {
          user_id: user.id,
          name: p.description,
          suggested_category:
            p.triageAction === 'Pró-labore' ? 'Folha - Administrativo' : p.category,
          last_triage_type: p.triageAction,
        })
      }
    })

    if (toAdd.length > 0) {
      await addTransactions(toAdd)
    }

    for (const mapping of Array.from(uniqueMappings.values())) {
      await saveMapping(mapping)
    }

    setLoading(false)
    toast({
      title: 'Concluído',
      description: `${toAdd.length} lançamentos importados com sucesso.`,
    })
    onComplete()
  }

  return (
    <div className="space-y-4 animate-fade-in flex flex-col h-full">
      <div className="flex justify-between items-center shrink-0">
        <h3 className="text-sm font-medium">Triagem de Lançamentos</h3>
        <p className="text-xs text-muted-foreground">{localItems.length} itens encontrados</p>
      </div>
      <div className="border rounded-md overflow-x-auto bg-white flex-1 relative">
        <Table>
          <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localItems.map((item) => (
              <TableRow
                key={item.id}
                className={item.triageAction === 'Já lançado' ? 'opacity-50 bg-slate-50' : ''}
              >
                <TableCell className="whitespace-nowrap text-xs">
                  {new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </TableCell>
                <TableCell className="max-w-[200px] text-xs">
                  <div className="truncate font-medium" title={item.description}>
                    {item.description}
                  </div>
                  {item.isDuplicate && item.triageAction !== 'Já lançado' && (
                    <div className="flex items-center gap-1.5 mt-1 text-amber-600 bg-amber-50 p-1.5 rounded-sm w-fit border border-amber-100">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="text-[10px] font-medium leading-none mt-[1px]">
                        Possível duplicidade
                      </span>
                      <div className="flex items-center gap-1 ml-2 border-l border-amber-200/80 pl-2">
                        <Checkbox
                          id={`ov-${item.id}`}
                          className="h-3 w-3 rounded-[2px]"
                          checked={!!item.duplicateOverride}
                          onCheckedChange={(c) => handleUpdate(item.id, 'duplicateOverride', !!c)}
                        />
                        <Label
                          htmlFor={`ov-${item.id}`}
                          className="text-[9px] cursor-pointer mt-[1px]"
                        >
                          Ignorar alerta
                        </Label>
                      </div>
                    </div>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium text-xs">
                  {formatCurrency(item.value)}
                </TableCell>
                <TableCell>
                  <Select
                    value={item.triageAction || ''}
                    onValueChange={(v: TriageAction) => handleUpdate(item.id, 'triageAction', v)}
                  >
                    <SelectTrigger
                      className={`w-[130px] h-8 text-xs ${!item.triageAction ? 'border-primary shadow-sm ring-1 ring-primary/20' : ''}`}
                    >
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Empresa">Empresa</SelectItem>
                      <SelectItem value="Pró-labore">Pró-labore</SelectItem>
                      <SelectItem value="Dividir">Dividir</SelectItem>
                      <SelectItem value="Já lançado">Já lançado</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="min-w-[280px]">
                  {item.triageAction === 'Empresa' && (
                    <div className="flex gap-2">
                      <Select
                        value={item.category}
                        onValueChange={(v) => handleUpdate(item.id, 'category', v)}
                      >
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={item.unit}
                        onValueChange={(v: Unidade) => handleUpdate(item.id, 'unit', v)}
                      >
                        <SelectTrigger className="h-8 text-xs w-[100px]">
                          <SelectValue placeholder="Unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIDADES.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {item.triageAction === 'Pró-labore' && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-md border border-slate-200">
                      <Info className="w-3.5 h-3.5" />
                      Despesa Fixa / Folha - Administrativo
                    </div>
                  )}
                  {item.triageAction === 'Dividir' && (
                    <div className="flex gap-3 items-center bg-slate-50 p-1.5 rounded-md border border-slate-100">
                      <div className="flex-1 space-y-1">
                        <Label className="text-[9px] uppercase tracking-wider text-muted-foreground ml-1">
                          Empresa
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          className="h-7 text-xs bg-white"
                          value={item.splitEmpresaValue || 0}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value))
                            handleUpdate(item.id, 'splitEmpresaValue', val)
                            handleUpdate(
                              item.id,
                              'splitProlaboreValue',
                              Math.max(0, item.value - val),
                            )
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-[9px] uppercase tracking-wider text-muted-foreground ml-1">
                          Pró-labore
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          className="h-7 text-xs bg-white"
                          value={item.splitProlaboreValue || 0}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value))
                            handleUpdate(item.id, 'splitProlaboreValue', val)
                            handleUpdate(
                              item.id,
                              'splitEmpresaValue',
                              Math.max(0, item.value - val),
                            )
                          }}
                        />
                      </div>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {localItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum item importado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between pt-4 shrink-0">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading || hasUnassigned || hasUnresolvedDuplicates || localItems.length === 0}
          className="gap-2 px-8"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          Confirmar Importação
        </Button>
      </div>
    </div>
  )
}
