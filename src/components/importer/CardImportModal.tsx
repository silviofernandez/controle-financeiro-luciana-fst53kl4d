import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useCreditCards } from '@/contexts/CreditCardContext'
import { useTransactions } from '@/contexts/TransactionContext'
import { useSettings } from '@/contexts/SettingsContext'
import { parseValueAndType } from '@/lib/import-utils'
import { formatCurrency } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ActionType = 'empresa' | 'prolabore' | 'split' | 'ignore' | null

interface CardRow {
  id: string
  date: string
  desc: string
  val: number
  action: ActionType
  category?: string
  splitCompany?: number
  splitPersonal?: number
  isDuplicate?: boolean
}

export function CardImportModal({ open, onOpenChange }: Props) {
  const { cards } = useCreditCards()
  const { transactions, addTransactions } = useTransactions()
  const { categories } = useSettings()

  const [step, setStep] = useState(1)
  const [selectedCard, setSelectedCard] = useState('')
  const [rawData, setRawData] = useState('')
  const [rows, setRows] = useState<CardRow[]>([])

  const parseData = () => {
    if (!selectedCard || !rawData.trim()) return

    const lines = rawData.split('\n').filter((l) => l.trim().length > 0)
    const parsed: CardRow[] = []

    lines.forEach((line, idx) => {
      const parts = line.split('\t')
      if (parts.length < 3) return
      const date = parts[0].trim()
      const desc = parts[1].trim()
      const { valor } = parseValueAndType(parts[2].trim())

      const dParts = date.split('/')
      let isoDate = date
      if (dParts.length === 3) isoDate = `20${dParts[2].slice(-2)}-${dParts[1]}-${dParts[0]}`

      const isDup = transactions.some((t) => {
        const tDate = t.data ? t.data.split('T')[0] : ''
        return tDate === isoDate && Math.abs(t.valor) === valor
      })

      parsed.push({
        id: `row-${idx}`,
        date: isoDate,
        desc,
        val: valor,
        action: isDup ? 'ignore' : null,
        isDuplicate: isDup,
      })
    })

    setRows(parsed)
    setStep(2)
  }

  const updateRow = (id: string, updates: Partial<CardRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)))
  }

  const handleConfirm = async () => {
    const toInsert: any[] = []

    rows.forEach((r) => {
      if (r.action === 'ignore' || !r.action) return

      const baseObj = {
        data: r.date,
        banco: 'Outros' as const,
        card_id: selectedCard,
        tipo: 'despesa' as const,
      }

      if (r.action === 'empresa') {
        toInsert.push({
          ...baseObj,
          descricao: r.desc,
          valor: r.val,
          unidade: 'Geral',
          categoria: r.category || 'Outros',
        })
      } else if (r.action === 'prolabore') {
        toInsert.push({
          ...baseObj,
          descricao: r.desc,
          valor: r.val,
          unidade: 'Pró-labore (Silvio/Luciana)',
          categoria: 'Pró-labore',
        })
      } else if (r.action === 'split') {
        if (r.splitCompany && r.splitCompany > 0) {
          toInsert.push({
            ...baseObj,
            descricao: `${r.desc} (Empresa)`,
            valor: r.splitCompany,
            unidade: 'Geral',
            categoria: r.category || 'Outros',
          })
        }
        if (r.splitPersonal && r.splitPersonal > 0) {
          toInsert.push({
            ...baseObj,
            descricao: `${r.desc} (Pró-labore)`,
            valor: r.splitPersonal,
            unidade: 'Pró-labore (Silvio/Luciana)',
            categoria: 'Pró-labore',
          })
        }
      }
    })

    if (toInsert.length > 0) {
      await addTransactions(toInsert)
    }

    setStep(1)
    setRawData('')
    setRows([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Fatura de Cartão</DialogTitle>
          <DialogDescription>
            Cole os dados da sua fatura para realizar a triagem. As despesas serão lançadas no
            cartão selecionado.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione o Cartão</label>
              <Select value={selectedCard} onValueChange={setSelectedCard}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um cartão" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Dados da Fatura (Copie e Cole do Excel/Sheets)
              </label>
              <Textarea
                placeholder="Data(Tab)Descrição(Tab)Valor&#10;10/10/24&#9;Uber&#9;25,90"
                className="h-64 font-mono text-xs whitespace-pre"
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
              />
            </div>
            <Button
              onClick={parseData}
              disabled={!selectedCard || !rawData.trim()}
              className="w-full"
            >
              Próximo
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-4 border rounded-md p-2 max-h-[60vh] overflow-y-auto">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className={`p-3 rounded-md border ${r.isDuplicate ? 'bg-orange-50 border-orange-200' : 'bg-slate-50'}`}
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{r.date}</span>
                        <span className="font-semibold text-sm">{r.desc}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(r.val)}
                        </span>
                        {r.isDuplicate && (
                          <Badge
                            variant="outline"
                            className="text-orange-600 bg-orange-100 border-orange-300"
                          >
                            Possível Duplicata (Já no Banco)
                          </Badge>
                        )}
                      </div>

                      {r.action === 'empresa' && (
                        <div className="mt-2 flex gap-2">
                          <Select
                            value={r.category || ''}
                            onValueChange={(v) => updateRow(r.id, { category: v })}
                          >
                            <SelectTrigger className="w-full md:w-[200px] h-8 text-xs">
                              <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {r.action === 'split' && (
                        <div className="mt-2 grid grid-cols-2 gap-2 max-w-sm">
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">
                              Empresa (R$)
                            </label>
                            <Input
                              type="number"
                              className="h-8 text-xs"
                              value={r.splitCompany || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0
                                updateRow(r.id, { splitCompany: val, splitPersonal: r.val - val })
                              }}
                            />
                            <Select
                              value={r.category || ''}
                              onValueChange={(v) => updateRow(r.id, { category: v })}
                            >
                              <SelectTrigger className="w-full h-8 text-xs mt-1">
                                <SelectValue placeholder="Categoria" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((c) => (
                                  <SelectItem key={c} value={c}>
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">
                              Pró-labore (R$)
                            </label>
                            <Input
                              type="number"
                              className="h-8 text-xs"
                              value={r.splitPersonal || ''}
                              disabled
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0 h-fit">
                      <Button
                        size="sm"
                        variant={r.action === 'empresa' ? 'default' : 'outline'}
                        onClick={() => updateRow(r.id, { action: 'empresa' })}
                      >
                        Empresa
                      </Button>
                      <Button
                        size="sm"
                        variant={r.action === 'prolabore' ? 'default' : 'outline'}
                        onClick={() => updateRow(r.id, { action: 'prolabore' })}
                      >
                        Pró-labore
                      </Button>
                      <Button
                        size="sm"
                        variant={r.action === 'split' ? 'default' : 'outline'}
                        onClick={() =>
                          updateRow(r.id, {
                            action: 'split',
                            splitCompany: r.val / 2,
                            splitPersonal: r.val / 2,
                          })
                        }
                      >
                        Dividir
                      </Button>
                      <Button
                        size="sm"
                        variant={r.action === 'ignore' ? 'destructive' : 'outline'}
                        onClick={() => updateRow(r.id, { action: 'ignore' })}
                      >
                        Ignorar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button onClick={handleConfirm} className="flex-1">
                Confirmar Importação
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
