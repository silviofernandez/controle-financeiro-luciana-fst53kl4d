import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useSettings } from '@/contexts/SettingsContext'
import { parseValueAndType, applyAutoTagging, guessBank } from '@/lib/import-utils'
import { PreviewItem } from './types'
import { Unidade, UNIDADES } from '@/types'

interface ImportMappingProps {
  headers: string[]
  data: string[][]
  onBack: () => void
  onComplete: (items: PreviewItem[]) => void
}

export function ImportMapping({ headers, data, onBack, onComplete }: ImportMappingProps) {
  const { applyRules } = useSettings()
  const [mapping, setMapping] = useState<Record<string, string>>({
    date: '',
    description: '',
    value: '',
    type: '',
    unit: '',
  })

  useEffect(() => {
    const newMap = { date: '', description: '', value: '', type: '', unit: '' }
    headers.forEach((h, i) => {
      const lower = h.toLowerCase()
      if (lower.includes('data') || lower.includes('vencimento')) newMap.date = i.toString()
      else if (lower.includes('descri') || lower.includes('histórico'))
        newMap.description = i.toString()
      else if (lower.includes('valor') || lower.includes('quantia')) newMap.value = i.toString()
      else if (lower.includes('tipo') || lower.includes('operação')) newMap.type = i.toString()
      else if (lower.includes('unidade') || lower.includes('filial')) newMap.unit = i.toString()
    })
    setMapping(newMap)
  }, [headers])

  const handleGeneratePreview = () => {
    if (!mapping.date || !mapping.description || !mapping.value) {
      toast({
        title: 'Erro',
        description: 'Mapeie Data, Descrição e Valor',
        variant: 'destructive',
      })
      return
    }

    const parsed: PreviewItem[] = []
    const dateIdx = parseInt(mapping.date)
    const descIdx = parseInt(mapping.description)
    const valIdx = parseInt(mapping.value)
    const unitIdx = parseInt(mapping.unit || '-1')
    const dataRows = data.slice(1)

    for (let i = 0; i < dataRows.length; i++) {
      const cols = dataRows[i]
      const dateStr = cols[dateIdx]
      const descStr = cols[descIdx]
      const valStr = cols[valIdx]

      if (!dateStr || !valStr) continue

      let isoDate = new Date().toISOString()
      const dateMatch = dateStr.match(/(\d{2})[/-](\d{2})[/-]?(\d{4})?/)
      if (dateMatch) {
        const y = dateMatch[3] || new Date().getFullYear().toString()
        isoDate = `${y}-${dateMatch[2]}-${dateMatch[1]}T10:00:00.000Z`
      } else if (!isNaN(Date.parse(dateStr))) {
        isoDate = new Date(dateStr).toISOString()
      }

      const desc = descStr.trim()
      const { valor, tipo: signType } = parseValueAndType(valStr)

      let unidade: Unidade = 'Geral'
      if (unitIdx >= 0 && cols[unitIdx]) {
        const u = cols[unitIdx].trim()
        if (UNIDADES.includes(u as Unidade)) unidade = u as Unidade
      }

      if (valor > 0 && desc) {
        const isBalance = desc.toLowerCase().includes('saldo financeiro')
        let autoTags = applyAutoTagging(desc)
        if (!autoTags.category) {
          const userRules = applyRules(desc)
          if (userRules.categoria) autoTags.category = userRules.categoria
        }

        const fallbackPbType = signType === 'receita' ? 'Receita' : 'Despesa Variável'

        parsed.push({
          id: `preview-${i}`,
          date: isoDate,
          description: desc,
          value: valor,
          category: autoTags.category,
          pbType: isBalance ? 'Receita' : autoTags.pbType || fallbackPbType,
          unit: unidade,
          bank: guessBank(desc),
          isCheckpoint: isBalance,
        })
      }
    }

    if (parsed.length === 0) {
      toast({ title: 'Erro', description: 'Nenhum dado válido extraído.', variant: 'destructive' })
      return
    }

    onComplete(parsed)
  }

  const headersWithIndex = headers.map((h, i) => ({ index: i.toString(), label: h }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
        <h3 className="text-sm font-medium text-slate-800 mb-2">Mapeamento de Colunas</h3>
        <p className="text-xs text-slate-500 mb-4">Selecione as colunas correspondentes.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              Data <span className="text-red-500">*</span>
            </Label>
            <Select value={mapping.date} onValueChange={(v) => setMapping({ ...mapping, date: v })}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {headersWithIndex.map((h) => (
                  <SelectItem key={h.index} value={h.index}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              Descrição <span className="text-red-500">*</span>
            </Label>
            <Select
              value={mapping.description}
              onValueChange={(v) => setMapping({ ...mapping, description: v })}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {headersWithIndex.map((h) => (
                  <SelectItem key={h.index} value={h.index}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              Valor <span className="text-red-500">*</span>
            </Label>
            <Select
              value={mapping.value}
              onValueChange={(v) => setMapping({ ...mapping, value: v })}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {headersWithIndex.map((h) => (
                  <SelectItem key={h.index} value={h.index}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500">Unidade (Opcional)</Label>
            <Select value={mapping.unit} onValueChange={(v) => setMapping({ ...mapping, unit: v })}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Ignorar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">Ignorar</SelectItem>
                {headersWithIndex.map((h) => (
                  <SelectItem key={h.index} value={h.index}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="flex justify-between pt-4 border-t border-border/50">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button onClick={handleGeneratePreview} className="gap-2">
          <CheckCircle2 className="w-4 h-4" /> Avançar
        </Button>
      </div>
    </div>
  )
}
