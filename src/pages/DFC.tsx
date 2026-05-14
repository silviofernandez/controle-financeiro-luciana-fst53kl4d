import React, { useMemo } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { format, subMonths, startOfMonth, isSameMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// @ts-expect-error
import * as types from '@/types/index'

const RECEITAS: string[] = types.RECEITAS || []
const DESPESAS_FIXAS: string[] = types.DESPESAS_FIXAS || []
const DESPESAS_VARIAVEIS: string[] = types.DESPESAS_VARIAVEIS || []

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export default function DFC() {
  // @ts-expect-error
  const { transactions = [] } = useTransactions()

  const months = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      return startOfMonth(subMonths(new Date(), 5 - i))
    })
  }, [])

  const data = useMemo(() => {
    const result = {
      receitas: {} as Record<string, number[]>,
      despesasFixas: {} as Record<string, number[]>,
      despesasVariaveis: {} as Record<string, number[]>,
      subtotais: {
        receitas: Array(6).fill(0),
        despesasFixas: Array(6).fill(0),
        despesasVariaveis: Array(6).fill(0),
      },
      resultadoLiquido: Array(6).fill(0),
    }

    const getGroup = (t: any) => {
      if (RECEITAS.includes(t.category) || t.type === 'Receita') return 'receitas'
      if (DESPESAS_FIXAS.includes(t.category) || t.type === 'Despesa Fixa') return 'despesasFixas'
      if (DESPESAS_VARIAVEIS.includes(t.category) || t.type === 'Despesa Variável')
        return 'despesasVariaveis'
      return null
    }

    transactions.forEach((t: any) => {
      if (!t.date) return
      // Safe parsing to avoid timezone shifts
      const tDate = parseISO(t.date.split(' ')[0])
      const monthIndex = months.findIndex((m) => isSameMonth(m, tDate))

      if (monthIndex === -1) return

      const group = getGroup(t)
      if (!group) return

      const category = t.category || 'Sem Categoria'

      if (!result[group][category]) {
        result[group][category] = Array(6).fill(0)
      }

      result[group][category][monthIndex] += t.amount
      result.subtotais[group][monthIndex] += t.amount

      if (group === 'receitas') {
        result.resultadoLiquido[monthIndex] += t.amount
      } else {
        result.resultadoLiquido[monthIndex] -= t.amount
      }
    })

    return result
  }, [transactions, months])

  const renderRow = (category: string, values: number[], isSubtotal = false, isNet = false) => (
    <TableRow
      key={category}
      className={`${isNet ? 'bg-primary/10 font-bold border-t-2 border-primary/20' : isSubtotal ? 'bg-muted/50 font-semibold' : ''}`}
    >
      <TableCell className={isNet || isSubtotal ? 'text-primary' : ''}>{category}</TableCell>
      {values.map((val, i) => (
        <TableCell key={i} className="text-right whitespace-nowrap">
          {formatCurrency(val)}
        </TableCell>
      ))}
    </TableRow>
  )

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Demonstrativo de Fluxo de Caixa
          </h1>
          <p className="text-muted-foreground mt-1">Análise financeira dos últimos 6 meses (DFC)</p>
        </div>
      </div>

      <Card className="shadow-md border-border/50">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle>DFC - 6 Meses</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="min-w-[200px]">Categoria</TableHead>
                {months.map((m, i) => (
                  <TableHead key={i} className="text-right capitalize min-w-[120px]">
                    {format(m, 'MMM/yyyy', { locale: ptBR })}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Receitas */}
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="font-bold bg-muted/20 text-primary">
                  RECEITAS OPERACIONAIS
                </TableCell>
              </TableRow>
              {Object.entries(data.receitas).map(([cat, vals]) => renderRow(cat, vals))}
              {Object.keys(data.receitas).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                    Nenhuma receita no período
                  </TableCell>
                </TableRow>
              )}
              {renderRow('Subtotal Receitas', data.subtotais.receitas, true)}

              {/* Despesas Fixas */}
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="font-bold bg-muted/20 text-primary mt-4">
                  DESPESAS FIXAS
                </TableCell>
              </TableRow>
              {Object.entries(data.despesasFixas).map(([cat, vals]) => renderRow(cat, vals))}
              {Object.keys(data.despesasFixas).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                    Nenhuma despesa fixa no período
                  </TableCell>
                </TableRow>
              )}
              {renderRow('Subtotal Despesas Fixas', data.subtotais.despesasFixas, true)}

              {/* Despesas Variáveis */}
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="font-bold bg-muted/20 text-primary mt-4">
                  DESPESAS VARIÁVEIS
                </TableCell>
              </TableRow>
              {Object.entries(data.despesasVariaveis).map(([cat, vals]) => renderRow(cat, vals))}
              {Object.keys(data.despesasVariaveis).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                    Nenhuma despesa variável no período
                  </TableCell>
                </TableRow>
              )}
              {renderRow('Subtotal Despesas Variáveis', data.subtotais.despesasVariaveis, true)}

              {/* Resultado Líquido */}
              {renderRow('Resultado Líquido', data.resultadoLiquido, false, true)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
