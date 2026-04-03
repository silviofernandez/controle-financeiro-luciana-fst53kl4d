import { useState, useEffect, useRef } from 'react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useMemo } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { toast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Info,
  FileText,
  ChevronsUpDown,
  Check,
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { CATEGORIES, UNIDADES, Transaction, Unidade } from '@/types'
import { PreviewItem, TriageAction } from './types'
import { getMappings, saveMapping } from '@/services/establishment_mappings'
import { useAuth } from '@/contexts/AuthContext'
import { usePersistentState } from '@/hooks/use-persistent-state'
import { useBlocker } from 'react-router-dom'
import { useImportSync } from '@/hooks/use-import-sync'
import { Clock } from 'lucide-react'
import { updateImportSession } from '@/services/import_sessions'
import { useDetails } from '@/contexts/DetailsContext'
import { createDetail } from '@/services/details'

function DescriptionEditor({
  item,
  localItems,
  suggestions,
  onChange,
  onBulkChange,
}: {
  item: PreviewItem
  localItems: PreviewItem[]
  suggestions: string[]
  onChange: (val: string) => void
  onBulkChange: (oldVal: string, newVal: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [alertOpen, setAlertOpen] = useState(false)
  const [pendingValue, setPendingValue] = useState('')

  const identicalCount = localItems.filter(
    (i) => i.id !== item.id && i.description === item.description,
  ).length

  const handleSelect = (newValue: string) => {
    if (newValue === item.description) {
      setOpen(false)
      return
    }

    if (identicalCount > 0) {
      setPendingValue(newValue)
      setAlertOpen(true)
    } else {
      onChange(newValue)
    }
    setOpen(false)
  }

  const exactMatch = suggestions.some((s) => s.toLowerCase() === searchValue.toLowerCase())

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(o) => {
          if (o) setSearchValue(item.description)
          setOpen(o)
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <div
                className={cn(
                  'line-clamp-2 text-xs leading-snug cursor-pointer border border-transparent hover:border-slate-300 hover:shadow-sm hover:bg-white p-1.5 rounded min-h-[32px] flex items-center w-full text-left transition-all',
                  open ? 'bg-white border-slate-300 shadow-sm' : 'bg-transparent',
                )}
              >
                {item.description || 'Descrição...'}
              </div>
            </PopoverTrigger>
          </TooltipTrigger>
          {!open && item.description && item.description.length > 30 && (
            <TooltipContent side="top" className="max-w-[300px] break-words">
              {item.description}
            </TooltipContent>
          )}
        </Tooltip>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Editar descrição..."
              value={searchValue}
              onValueChange={setSearchValue}
              className="h-9 text-xs"
            />
            <CommandList>
              <CommandEmpty className="p-2 text-xs text-muted-foreground text-center">
                Nenhuma sugestão encontrada.
              </CommandEmpty>
              <CommandGroup className="max-h-[200px] overflow-auto">
                {suggestions.map((s) => (
                  <CommandItem
                    key={s}
                    value={s}
                    onSelect={() => handleSelect(s)}
                    className="text-xs"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3 w-3 shrink-0',
                        item.description === s ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="truncate">{s}</span>
                  </CommandItem>
                ))}
                {searchValue && !exactMatch && (
                  <CommandItem
                    value={searchValue}
                    onSelect={() => handleSelect(searchValue)}
                    className="text-xs font-semibold text-primary"
                  >
                    <Check className="mr-2 h-3 w-3 opacity-0 shrink-0" />
                    Usar "{searchValue}"
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padronizar Descrição</AlertDialogTitle>
            <AlertDialogDescription>
              Este texto ("{item.description}") aparece em {identicalCount + 1} lançamentos nesta
              importação. Deseja padronizar todos para o novo nome "{pendingValue}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                onChange(pendingValue)
                setAlertOpen(false)
              }}
            >
              Apenas este
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onBulkChange(item.description, pendingValue)
                setAlertOpen(false)
              }}
            >
              Sim, padronizar todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function CategoryCombobox({
  value,
  isSuggested,
  onChange,
  customCategories,
}: {
  value: string
  isSuggested?: boolean
  onChange: (val: string) => void
  customCategories: string[]
}) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const allCategories = Array.from(new Set(['A triar', ...CATEGORIES, ...customCategories]))
  const exactMatch = allCategories.some((c) => c.toLowerCase() === searchValue.toLowerCase())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-8 w-full flex-1 justify-between text-xs font-normal',
            isSuggested &&
              'bg-yellow-100/50 hover:bg-yellow-100/70 border-yellow-300 text-yellow-900',
            (!value || value === 'A triar') &&
              !isSuggested &&
              'border-amber-400 ring-1 ring-amber-300 bg-amber-50 text-amber-800 font-medium',
          )}
        >
          <span className="truncate">{value || 'Categoria...'}</span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar categoria..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-9 text-xs"
          />
          <CommandList>
            <CommandEmpty className="p-2 text-xs text-muted-foreground text-center">
              Nenhuma categoria encontrada.
            </CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-auto">
              {allCategories.map((cat) => (
                <CommandItem
                  key={cat}
                  value={cat}
                  onSelect={() => {
                    onChange(cat)
                    setOpen(false)
                    setSearchValue('')
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn('mr-2 h-3 w-3', value === cat ? 'opacity-100' : 'opacity-0')}
                  />
                  {cat}
                </CommandItem>
              ))}
              {searchValue && !exactMatch && (
                <CommandItem
                  value={searchValue}
                  onSelect={() => {
                    onChange(searchValue)
                    setOpen(false)
                    setSearchValue('')
                  }}
                  className="text-xs font-semibold text-primary"
                >
                  <Check className="mr-2 h-3 w-3 opacity-0" />
                  Criar "{searchValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface ImportPreviewProps {
  items: PreviewItem[]
  localItems: PreviewItem[]
  setLocalItems: React.Dispatch<React.SetStateAction<PreviewItem[]>>
  sessionId: string | null
  setSessionId: (id: string | null) => void
  onBack: () => void
  onComplete: () => void
}

export function ImportPreview({
  items,
  localItems,
  setLocalItems,
  sessionId,
  setSessionId,
  onBack,
  onComplete,
}: ImportPreviewProps) {
  const { transactions, addTransactions } = useTransactions()
  const { user } = useAuth()
  const { details } = useDetails()
  const [scrollPos, setScrollPos] = usePersistentState('importer_scroll', 0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(false)
  const [customCategories, setCustomCategories] = useState<string[]>([])

  const { isSyncing, dirtyIds, markDirty, hasUnsavedChanges } = useImportSync(
    sessionId,
    localItems,
    scrollPos,
  )

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname,
  )

  const uniqueDescriptions = useMemo(() => {
    const set = new Set<string>()
    transactions.forEach((t) => {
      if (t.descricao) set.add(t.descricao)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [transactions])

  const handleBulkDescriptionChange = async (oldDesc: string, newDesc: string) => {
    setLocalItems((prev) =>
      prev.map((p) => {
        if (p.description === oldDesc) {
          markDirty(p.id)
          return { ...p, description: newDesc }
        }
        return p
      }),
    )
    const exists = details.some((d) => d.name.toLowerCase() === newDesc.toLowerCase())
    if (!exists && user) {
      try {
        await createDetail({ user_id: user.id, name: newDesc })
      } catch (e) {
        console.error('Failed to create detail', e)
      }
    }
  }

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (scrollRef.current && scrollPos > 0) {
      scrollRef.current.scrollTop = scrollPos
    }
  }, []) // On mount restore scroll

  useEffect(() => {
    if (localItems.length > 0) return
    if (items.length === 0) return

    let mounted = true
    getMappings().then((mappings) => {
      if (!mounted) return
      const changedIds: string[] = []

      const mappedItems = items.map((p, i, arr) => {
        let updated = { ...p }

        const match = mappings.find((m) =>
          p.description.toLowerCase().includes(m.name.toLowerCase()),
        )
        if (match && (!updated.category || updated.category === 'A triar')) {
          updated.triageAction = match.last_triage_type || 'Empresa'
          updated.category = match.suggested_category || p.category
          updated.isSuggestedCategory = true
        }

        if (!updated.triageAction && updated.category && updated.category !== 'A triar') {
          updated.triageAction = 'Empresa'
        }

        const itemDate = new Date(updated.date).getTime()

        const isDbDuplicate = transactions.some((t) => {
          if (t.valor !== updated.value) return false
          if (t.unidade !== updated.unit) return false
          const tDate = new Date(t.data).getTime()
          const diffDays = Math.abs(tDate - itemDate) / (1000 * 60 * 60 * 24)
          return diffDays <= 3
        })

        const isBatchDuplicate = arr.some((other, otherIdx) => {
          if (i === otherIdx) return false
          if (other.value !== updated.value) return false
          if (other.unit !== updated.unit) return false
          const otherDate = new Date(other.date).getTime()
          const diffDays = Math.abs(otherDate - itemDate) / (1000 * 60 * 60 * 24)
          return diffDays <= 3
        })

        updated.isDuplicate = isDbDuplicate || isBatchDuplicate

        if (JSON.stringify(updated) !== JSON.stringify(p)) {
          changedIds.push(updated.id)
        }

        const descLower = updated.description.toLowerCase()
        if (
          descLower.includes('sabesp') &&
          updated.value === 146.68 &&
          updated.unit === 'Pederneiras'
        ) {
          updated.hasSpecificAlert = 'Água Sabesp Pederneiras'
        } else if (
          descLower.includes('aluguel') &&
          updated.value === 2514.8 &&
          (updated.unit === 'Jaú' || updated.unit === 'Jau')
        ) {
          updated.hasSpecificAlert = 'Aluguel Prédio Jaú'
        } else if (
          descLower.includes('cpfl') &&
          updated.value === 629.46 &&
          (updated.unit === 'L. Paulista' || updated.unit === 'Lençóis Paulista')
        ) {
          updated.hasSpecificAlert = 'CPFL Lençóis'
        } else if (
          descLower.includes('cpfl') &&
          updated.value === 873.64 &&
          updated.unit === 'Pederneiras'
        ) {
          updated.hasSpecificAlert = 'CPFL Pederneiras'
        }

        if (updated.triageAction === 'Dividir' && !updated.splitEmpresaValue) {
          updated.splitEmpresaValue = updated.value / 2
          updated.splitProlaboreValue = updated.value / 2
        }

        return updated
      })

      setLocalItems(mappedItems)
      changedIds.forEach((id) => markDirty(id))
    })
    return () => {
      mounted = false
    }
  }, [transactions, items, localItems.length, setLocalItems, markDirty])

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
    markDirty(id)
  }

  const handleDescriptionChange = async (id: string, newDesc: string) => {
    handleUpdate(id, 'description', newDesc)
    const exists = details.some((d) => d.name.toLowerCase() === newDesc.toLowerCase())
    if (!exists && user) {
      try {
        await createDetail({ user_id: user.id, name: newDesc })
      } catch (e) {
        console.error('Failed to create detail', e)
      }
    }
  }

  const handleCategoryChange = (id: string, newCategory: string) => {
    const item = localItems.find((i) => i.id === id)
    if (!item) return
    const description = item.description

    setLocalItems((prev) =>
      prev.map((p) => {
        if (p.id === id || p.description === description) {
          markDirty(p.id)
          return { ...p, category: newCategory, isSuggestedCategory: false }
        }
        return p
      }),
    )

    if (!CATEGORIES.includes(newCategory as any) && !customCategories.includes(newCategory)) {
      setCustomCategories((prev) => [...prev, newCategory])
    }
  }

  const handleDelete = (id: string) => {
    setLocalItems((prev) => prev.filter((p) => p.id !== id))
    markDirty(id)
  }

  const handleConfirm = async () => {
    setLoading(true)

    const toAdd: Omit<Transaction, 'id' | 'created_at'>[] = []
    const uniqueMappings = new Map<string, any>()

    localItems.forEach((p) => {
      if (p.triageAction === 'Já lançado') return

      const action = p.triageAction || 'Empresa'

      if (action === 'Empresa') {
        toAdd.push({
          descricao: p.description || 'Sem descrição',
          valor: p.value || 0,
          data: p.date,
          unidade: p.unit || 'Geral',
          banco: p.bank || 'Outros',
          tipo: p.pbType === 'Receita' ? 'receita' : 'despesa',
          classificacao:
            p.pbType === 'Despesa Fixa'
              ? 'fixo'
              : p.pbType === 'Despesa Variável'
                ? 'variavel'
                : null,
          categoria: p.category || 'A triar',
          isCheckpoint: p.isCheckpoint,
        })
      } else if (action === 'Pró-labore') {
        toAdd.push({
          descricao: `Pró-labore - ${p.description || 'Sem descrição'}`,
          valor: p.value || 0,
          data: p.date,
          unidade: p.unit || 'Pró-labore (Silvio/Luciana)',
          banco: p.bank || 'Outros',
          tipo: 'despesa',
          classificacao: 'fixo',
          categoria: 'Pró-labore',
        })
      } else if (action === 'Dividir') {
        if (p.splitEmpresaValue && p.splitEmpresaValue > 0) {
          toAdd.push({
            descricao: p.description || 'Sem descrição',
            valor: p.splitEmpresaValue,
            data: p.date,
            unidade: p.unit || 'Geral',
            banco: p.bank || 'Outros',
            tipo: p.pbType === 'Receita' ? 'receita' : 'despesa',
            classificacao:
              p.pbType === 'Despesa Fixa'
                ? 'fixo'
                : p.pbType === 'Despesa Variável'
                  ? 'variavel'
                  : null,
            categoria: p.category || 'A triar',
          })
        }
        if (p.splitProlaboreValue && p.splitProlaboreValue > 0) {
          toAdd.push({
            descricao: `Pró-labore - ${p.description || 'Sem descrição'}`,
            valor: p.splitProlaboreValue,
            data: p.date,
            unidade: p.unit || 'Pró-labore (Silvio/Luciana)',
            banco: p.bank || 'Outros',
            tipo: 'despesa',
            classificacao: 'fixo',
            categoria: 'Pró-labore',
          })
        }
      }

      if (user && action !== 'Já lançado' && p.description) {
        uniqueMappings.set(p.description, {
          user_id: user.id,
          name: p.description,
          suggested_category: action === 'Pró-labore' ? 'Pró-labore' : p.category || 'A triar',
          last_triage_type: action,
        })
      }
    })

    if (toAdd.length > 0) {
      await addTransactions(toAdd)
    }

    for (const mapping of Array.from(uniqueMappings.values())) {
      await saveMapping(mapping)
    }

    if (sessionId) {
      await updateImportSession(sessionId, { status: 'Completed', triage_state: localItems })
    }
    setSessionId(null)

    setLoading(false)
    toast({
      title: 'Concluído',
      description: `${toAdd.length} lançamentos importados com sucesso.`,
    })
    onComplete()
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollPos(e.currentTarget.scrollTop)
  }

  return (
    <div className="space-y-4 animate-fade-in flex flex-col h-full">
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium">Triagem Inteligente</h3>
          <Button
            onClick={handleConfirm}
            disabled={loading || localItems.length === 0}
            size="sm"
            className="gap-2"
          >
            {loading ? (
              <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3" />
            )}
            Salvar Tudo Agora
          </Button>
        </div>
        <div className="flex gap-4">
          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded border border-blue-100">
            Fin: {localItems.filter((i) => i.source === 'Financeiro').length}
          </span>
          <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
            Op: {localItems.filter((i) => i.source === 'Operacional').length}
          </span>
          <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded border border-slate-200">
            Total: {localItems.length}
          </span>
        </div>
      </div>
      <div
        className="border rounded-md bg-white flex-1 max-h-[60vh] overflow-y-auto relative"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        <Table>
          <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
            <TableRow>
              <TableHead className="w-10">Fonte</TableHead>
              <TableHead>Data / Unidade</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead className="w-12 text-center">Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localItems.map((item) => {
              const isDupe =
                item.isDuplicate && !item.duplicateOverride && item.triageAction !== 'Já lançado'
              return (
                <TableRow
                  key={item.id}
                  className={cn(
                    item.triageAction === 'Já lançado' ? 'opacity-50 bg-slate-50' : '',
                    isDupe ? 'bg-amber-50 hover:bg-amber-100 border-l-4 border-amber-400' : '',
                    item.isSuggestedCategory && !isDupe ? 'bg-yellow-50/50' : '',
                  )}
                >
                  <TableCell>
                    {item.source === 'Financeiro' ? (
                      <div
                        className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-blue-600"
                        title="Financeiro (Integrale)"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div
                        className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-emerald-600"
                        title="Operacional (Luciana)"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    <div>{new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                      {item.unit}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] text-xs">
                    <DescriptionEditor
                      item={item}
                      localItems={localItems}
                      suggestions={uniqueDescriptions}
                      onChange={(val) => handleDescriptionChange(item.id, val)}
                      onBulkChange={handleBulkDescriptionChange}
                    />
                    {item.hasSpecificAlert && (
                      <div className="flex items-center gap-1 mt-1 text-red-600 bg-red-100 p-1 rounded-sm w-fit border border-red-200">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-[10px] font-bold leading-none mt-[1px]">
                          ALERTA: {item.hasSpecificAlert}
                        </span>
                      </div>
                    )}
                    {isDupe && (
                      <div className="flex items-center gap-1.5 mt-1 text-amber-700 bg-amber-200/40 p-1.5 rounded-sm w-fit border border-amber-200">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-[10px] font-medium leading-none mt-[1px]">
                          Possível duplicidade
                        </span>
                        <div className="flex items-center gap-1 ml-2 border-l border-amber-300 pl-2">
                          <Checkbox
                            id={`ov-${item.id}`}
                            className="h-3 w-3 rounded-[2px] border-amber-500 data-[state=checked]:bg-amber-600"
                            checked={!!item.duplicateOverride}
                            onCheckedChange={(c) => handleUpdate(item.id, 'duplicateOverride', !!c)}
                          />
                          <Label
                            htmlFor={`ov-${item.id}`}
                            className="text-[9px] cursor-pointer mt-[1px] text-amber-800 font-semibold"
                          >
                            Ignorar alerta
                          </Label>
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-bold text-xs">
                    {formatCurrency(item.value)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={item.triageAction || ''}
                      onValueChange={(v: TriageAction) => handleUpdate(item.id, 'triageAction', v)}
                    >
                      <SelectTrigger
                        className={cn(
                          'w-[130px] h-8 text-xs',
                          !item.triageAction && 'border-primary shadow-sm ring-1 ring-primary/20',
                          item.isSuggestedCategory &&
                            'bg-yellow-100/50 border-yellow-300 text-yellow-900',
                        )}
                      >
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Empresa">Empresa</SelectItem>
                        <SelectItem value="Pró-labore">Pró-labore</SelectItem>
                        <SelectItem value="Dividir">Dividir</SelectItem>
                        <SelectItem value="Já lançado">Já lançado (Ignorar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[280px]">
                    {item.triageAction === 'Empresa' && (
                      <div className="flex gap-2">
                        <CategoryCombobox
                          value={item.category}
                          isSuggested={item.isSuggestedCategory}
                          onChange={(val) => handleCategoryChange(item.id, val)}
                          customCategories={customCategories}
                        />
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
                      <div className="text-[11px] text-emerald-800 font-medium flex items-center gap-1.5 bg-emerald-50 p-1.5 rounded-md border border-emerald-200">
                        <Info className="w-3.5 h-3.5" />
                        Pró-labore (Despesa Fixa)
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
                  <TableCell className="text-center">
                    {dirtyIds.has(item.id) || isSyncing ? (
                      <div
                        className="w-6 h-6 mx-auto rounded-full bg-amber-100 flex items-center justify-center"
                        title="Salvando..."
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                      </div>
                    ) : (
                      <div
                        className="w-6 h-6 mx-auto rounded-full bg-emerald-100 flex items-center justify-center"
                        title="Salvo na nuvem"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
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
              )
            })}
            {localItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum item para triagem.
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
          disabled={loading || localItems.length === 0}
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

      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-lg font-bold mb-2">Alterações não salvas</h2>
            <p className="text-sm text-slate-600 mb-6">
              Você tem {dirtyIds.size} itens não confirmados. Deseja salvar antes de sair?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => blocker.reset?.()}>
                Continuar aguardando
              </Button>
              <Button variant="destructive" onClick={() => blocker.proceed?.()}>
                Sair sem salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
