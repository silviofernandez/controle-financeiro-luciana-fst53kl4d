import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useState } from 'react'
import { ImportInput } from './ImportInput'
import { ImportPreview } from './ImportPreview'
import { PreviewItem } from './types'
import { applyAutoTagging, parseValueAndType, guessBank, applySalaryRule } from '@/lib/import-utils'
import { Unidade } from '@/types'
import { useNavigate } from 'react-router-dom'

export function ImportModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [items, setItems] = useState<PreviewItem[]>([])
  const navigate = useNavigate()

  const handleDataParsed = (finData: string[][] | null, opData: string[][] | null) => {
    const allItems: PreviewItem[] = []

    const processGrid = (data: string[][], source: 'Financeiro' | 'Operacional') => {
      const headers = data[0].map((h) => h.toLowerCase())

      const dateIdx = headers.findIndex((h) => h.includes('data') || h.includes('vencimento'))
      const valIdx = headers.findIndex((h) => h.includes('valor') || h.includes('quantia'))
      const descIdx = headers.findIndex(
        (h) => h.includes('descri') || h.includes('histórico') || h.includes('historico'),
      )
      const unitIdx = headers.findIndex(
        (h) => h.includes('unidade') || h.includes('filial') || h.includes('loja'),
      )
      const catIdx =
        source === 'Financeiro'
          ? headers.findIndex((h) => h.includes('categoria') || h.includes('classificação'))
          : -1
      const bankIdx = headers.findIndex((h) => h.includes('banco'))

      const isLucianaFormat =
        source === 'Operacional' &&
        headers.some((h) => h.includes('jaú') || h.includes('jau')) &&
        headers.some((h) => h.includes('pederneiras'))

      let jauIdx = -1,
        pedIdx = -1,
        lpIdx = -1,
        proIdx = -1
      const genericProLaboreIdx = headers.findIndex(
        (h) => h.includes('pró-labore') || h.includes('pro-labore') || h.includes('pro labore'),
      )

      if (isLucianaFormat) {
        jauIdx = headers.findIndex((h) => h.includes('jaú') || h.includes('jau'))
        pedIdx = headers.findIndex((h) => h.includes('pederneiras'))
        lpIdx = headers.findIndex((h) => h.includes('paulista'))
        proIdx = genericProLaboreIdx
      }

      data.slice(1).forEach((row) => {
        if (row.every((cell) => !cell.trim())) return

        const dateStr = dateIdx >= 0 ? row[dateIdx] : ''
        if (!dateStr) return

        let date = dateStr
        if (date.includes('/')) {
          const parts = date.split('/')
          if (parts.length === 2) {
            const currentYear = new Date().getFullYear()
            date = `${currentYear}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
          } else if (parts.length >= 3) {
            date = `${parts[2].length === 2 ? '20' + parts[2] : parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
          }
        }

        const desc = descIdx >= 0 ? row[descIdx]?.trim() : ''
        if (desc.toUpperCase() === 'SALDO FINANCEIRO') return

        let valor = 0
        let tipo = 'despesa'
        let unit: Unidade = 'Geral'
        let isProLabore = false

        if (isLucianaFormat) {
          const vJau = parseValueAndType(row[jauIdx] || '0').valor
          const vPed = parseValueAndType(row[pedIdx] || '0').valor
          const vLp = parseValueAndType(row[lpIdx] || '0').valor
          const vPro = parseValueAndType(row[proIdx] || '0').valor

          if (vJau > 0) {
            valor = vJau
            unit = 'Jaú'
          } else if (vPed > 0) {
            valor = vPed
            unit = 'Pederneiras'
          } else if (vLp > 0) {
            valor = vLp
            unit = 'Lençóis Paulista'
          } else if (vPro > 0) {
            valor = vPro
            unit = 'Pró-labore (Silvio/Luciana)'
            isProLabore = true
          }

          if (valor === 0) return
        } else {
          const valStr = valIdx >= 0 ? row[valIdx] : '0'
          const parsed = parseValueAndType(valStr)
          valor = parsed.valor
          tipo = parsed.tipo
          if (valor === 0) return

          if (unitIdx >= 0 && row[unitIdx]) {
            const uRaw = row[unitIdx].trim().toLowerCase()
            if (uRaw.includes('ja')) unit = 'Jaú'
            else if (uRaw.includes('pederneiras')) unit = 'Pederneiras'
            else if (uRaw.includes('paulista') || uRaw.includes('len')) unit = 'Lençóis Paulista'
            else if (uRaw.includes('pró') || uRaw.includes('pro'))
              unit = 'Pró-labore (Silvio/Luciana)'
          }

          if (genericProLaboreIdx >= 0 && row[genericProLaboreIdx]) {
            const plVal = row[genericProLaboreIdx].trim().toLowerCase()
            if (plVal === 'sim' || plVal === 'x' || parseFloat(plVal) > 0) {
              isProLabore = true
            }
          }
        }

        let category = 'A triar'
        let pbType =
          source === 'Operacional'
            ? 'Despesa Variável'
            : tipo === 'receita'
              ? 'Receita'
              : 'Despesa Variável'
        const bank = bankIdx >= 0 && row[bankIdx] ? guessBank(row[bankIdx]) : guessBank(desc)

        if (catIdx >= 0 && row[catIdx]) {
          category = row[catIdx].trim() || 'A triar'
        }

        if (isProLabore) {
          category = 'Pró-labore'
          pbType = 'Despesa Fixa'
          unit = 'Pró-labore (Silvio/Luciana)'
        } else if (category === 'A triar') {
          const salCat = applySalaryRule(desc, unit)
          if (salCat) {
            category = salCat
            pbType = 'Despesa Fixa'
          } else {
            const auto = applyAutoTagging(desc)
            if (auto.category) {
              category = auto.category
              pbType = auto.pbType || pbType
            }
          }
        }

        allItems.push({
          id: crypto.randomUUID(),
          date,
          value: valor,
          description: desc,
          category,
          pbType,
          unit,
          bank,
          source,
          triageAction: null,
          splitEmpresaValue: 0,
          splitProlaboreValue: 0,
        })
      })
    }

    if (finData && finData.length > 1) processGrid(finData, 'Financeiro')
    if (opData && opData.length > 1) processGrid(opData, 'Operacional')

    setItems(allItems)
    setStep(2)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setTimeout(() => setStep(1), 300)
      }}
    >
      <DialogContent className="max-w-[95vw] lg:max-w-6xl h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>Importação Dupla e Triagem</DialogTitle>
          <DialogDescription>
            Consolide dados do Financeiro e Operacional simultaneamente.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden min-h-0 pt-4">
          {step === 1 ? (
            <ImportInput onDataParsed={handleDataParsed} />
          ) : (
            <ImportPreview
              items={items}
              onBack={() => setStep(1)}
              onComplete={() => {
                onOpenChange(false)
                setTimeout(() => navigate('/relatorios'), 150)
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
