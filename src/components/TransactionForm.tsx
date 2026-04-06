import { useState, FormEvent, ChangeEvent } from 'react'
import { useTransactions } from '@/contexts/TransactionContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { formatCurrency, parseCurrency } from '@/lib/utils'
import { Loader2, Camera, FileText } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { ImportModal } from './importer/ImportModal'
import { OCRScannerModal } from './OCRScannerModal'
import { CATEGORIES, UNIDADES, BANCOS } from '@/types'

export function TransactionForm() {
  const { addTransaction } = useTransactions()

  const [formType, setFormType] = useState<'receita' | 'despesa_fixa' | 'despesa_variavel'>(
    'despesa_variavel',
  )

  const [descricao, setDescricao] = useState('')
  const [valorInput, setValorInput] = useState('')
  const [dataLancamento, setDataLancamento] = useState(() => {
    try {
      return new Date().toISOString().split('T')[0]
    } catch {
      return ''
    }
  })
  const [competencia, setCompetencia] = useState('')
  const [unidade, setUnidade] = useState('')
  const [categoria, setCategoria] = useState('')
  const [banco, setBanco] = useState('')
  const [observacao, setObservacao] = useState('')

  const [loading, setLoading] = useState(false)

  const [importModalOpen, setImportModalOpen] = useState(false)
  const [ocrModalOpen, setOcrModalOpen] = useState(false)

  const handleValorChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValorInput(formatCurrency(parseCurrency(e.target.value)))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!descricao || !valorInput || !dataLancamento || !unidade || !categoria) {
      toast({
        title: 'Atenção',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      await addTransaction({
        descricao: descricao.trim(),
        valor: parseCurrency(valorInput),
        tipo: formType,
        data: dataLancamento,
        unidade,
        categoria,
        banco: banco || 'Outros',
        competencia: competencia.trim() || undefined,
        observacoes: observacao.trim() || undefined,
      })

      setDescricao('')
      setValorInput('')
      setObservacao('')
      setCompetencia('')
      // Keep unidade, categoria and data for easier sequential inputs
    } catch (error: any) {
      // context already handles the error toast
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleScanComplete = (extracted: any) => {
    if (extracted.date) setDataLancamento(extracted.date)
    if (extracted.amount) setValorInput(formatCurrency(extracted.amount))

    if (extracted.triageAction === 'Pró-labore') {
      setFormType('despesa_fixa')
      setDescricao(`Pró-labore - ${extracted.establishment}`)
      setUnidade('Pró-labore (Silvio/Luciana)')
    } else {
      setFormType('despesa_variavel')
      setDescricao(extracted.establishment)
    }
    toast({ title: 'Sucesso', description: 'Dados extraídos do documento com sucesso!' })
  }

  return (
    <>
      <Card className="shadow-md border-blue-100/50">
        <CardHeader className="bg-gradient-to-r from-white to-blue-50/80 pb-4 rounded-t-lg">
          <div className="flex justify-between items-center w-full flex-wrap gap-2">
            <CardTitle className="text-lg">Novo Lançamento</CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs bg-white shadow-sm"
                onClick={() => setOcrModalOpen(true)}
              >
                <Camera className="w-3 h-3 mr-1.5" /> Ler Doc
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs bg-white shadow-sm"
                onClick={() => setImportModalOpen(true)}
              >
                <FileText className="w-3 h-3 mr-1.5" /> Importar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row bg-slate-100 p-1 rounded-lg gap-1">
              <button
                type="button"
                onClick={() => setFormType('receita')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formType === 'receita' ? 'bg-white text-emerald-600 shadow-sm' : 'text-muted-foreground'}`}
              >
                Receita
              </button>
              <button
                type="button"
                onClick={() => setFormType('despesa_fixa')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formType === 'despesa_fixa' ? 'bg-white text-indigo-600 shadow-sm' : 'text-muted-foreground'}`}
              >
                Despesa Fixa
              </button>
              <button
                type="button"
                onClick={() => setFormType('despesa_variavel')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${formType === 'despesa_variavel' ? 'bg-white text-amber-600 shadow-sm' : 'text-muted-foreground'}`}
              >
                Despesa Variável
              </button>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input
                required
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Pagamento Fornecedor"
                className="bg-white"
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor</Label>
                <Input
                  required
                  value={valorInput}
                  onChange={handleValorChange}
                  placeholder="R$ 0,00"
                  className="bg-white font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Data de Lançamento</Label>
                <Input
                  type="date"
                  required
                  value={dataLancamento}
                  onChange={(e) => setDataLancamento(e.target.value)}
                  className="bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria} required>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione" />
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
              <div className="space-y-1.5">
                <Label>Unidade</Label>
                <Select value={unidade} onValueChange={setUnidade} required>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione" />
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
              <div className="space-y-1.5">
                <Label>Banco</Label>
                <Select value={banco} onValueChange={setBanco}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANCOS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Competência (Opcional)</Label>
              <Input
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                className="bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Observações (Opcional)</Label>
              <Textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Detalhes adicionais ou justificativas..."
                className="bg-white min-h-[60px] resize-y"
              />
            </div>

            <Button type="submit" className="w-full h-11 shadow-sm mt-2" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      <ImportModal open={importModalOpen} onOpenChange={setImportModalOpen} />
      <OCRScannerModal
        open={ocrModalOpen}
        onOpenChange={setOcrModalOpen}
        onScanComplete={handleScanComplete}
      />
    </>
  )
}
