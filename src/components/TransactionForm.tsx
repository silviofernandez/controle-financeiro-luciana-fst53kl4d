import React, { useState, useEffect } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { CATEGORIES } from '@/types'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { formatCurrency, parseCurrency } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const KEYWORD_MAP: Record<string, string> = {
  uber: 'Transporte',
  '99': 'Transporte',
  ifood: 'Alimentação',
  mercado: 'Alimentação',
  farmácia: 'Saúde',
  salário: 'Trabalho',
  luz: 'Casa',
  água: 'Casa',
  internet: 'Casa',
  restaurante: 'Alimentação',
  médico: 'Saúde',
}

export function TransactionForm() {
  const { addTransaction } = useTransactions()
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('despesa')
  const [descricao, setDescricao] = useState('')
  const [valorInput, setValorInput] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [categoria, setCategoria] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const descLower = descricao.toLowerCase()
    for (const [key, cat] of Object.entries(KEYWORD_MAP)) {
      if (descLower.includes(key)) {
        setCategoria(cat)
        break
      }
    }
  }, [descricao])

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseCurrency(e.target.value)
    setValorInput(formatCurrency(val))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!descricao || !valorInput || !categoria) return

    setLoading(true)
    const valor = parseCurrency(valorInput)

    // Simulate delay for UX
    await new Promise((r) => setTimeout(r, 400))

    addTransaction({ tipo, descricao, valor, data: new Date(data).toISOString(), categoria })

    setDescricao('')
    setValorInput('')
    setLoading(false)
  }

  return (
    <Card id="inserir" className="shadow-md border-blue-100/50">
      <CardHeader className="bg-gradient-to-r from-white to-blue-50/80 pb-4 rounded-t-lg">
        <CardTitle className="text-lg">Novo Lançamento</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setTipo('receita')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tipo === 'receita' ? 'bg-white text-green-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Receita
            </button>
            <button
              type="button"
              onClick={() => setTipo('despesa')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${tipo === 'despesa' ? 'bg-white text-red-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Despesa
            </button>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Supermercado"
              className="bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                required
                value={valorInput}
                onChange={handleValorChange}
                placeholder="R$ 0,00"
                className="bg-white font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria} required>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full h-12 shadow-sm transition-transform active:scale-[0.98]"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Adicionar Lançamento
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
