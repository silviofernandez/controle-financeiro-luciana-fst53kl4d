import { Banco } from '@/types'

export const guessBank = (desc: string): Banco => {
  if (!desc) return 'Outros'
  const d = desc.toLowerCase()
  if (d.includes('santander')) return 'Santander'
  if (d.includes('inter')) return 'Inter'
  if (d.includes('btg')) return 'BTG'
  if (d.includes('nu') || d.includes('nubank')) return 'Nubank'
  if (d.includes('caixa')) return 'Caixa'
  if (d.includes('d financeiro')) return 'D Financeiro'
  if (d.includes('itau') || d.includes('itaú')) return 'Itaú'
  if (d.includes('neon')) return 'Neon'
  return 'Outros'
}

export const parseValueAndType = (valStr: string) => {
  if (!valStr) return { valor: 0, tipo: 'despesa' as const }
  const isNegative = valStr.includes('-') || valStr.includes(' D')
  let clean = valStr.replace(/[^0-9,.-]/g, '')
  if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.')
  } else {
    clean = clean.replace(/,/g, '')
  }
  const val = parseFloat(clean) || 0
  return {
    valor: Math.abs(val),
    tipo: val < 0 || isNegative ? 'despesa' : 'receita',
  }
}

export const applySalaryRule = (desc: string, unit: string): string | null => {
  const d = desc.toLowerCase()
  if (d.startsWith('sal ') || d.includes('salário') || d.includes('salario')) {
    if (unit === 'Jau' || unit === 'Jaú') return 'Folha - Administrativo'
    if (unit === 'Pederneiras') return 'Folha - Pederneiras'
    if (unit === 'L. Paulista' || unit === 'Lençóis Paulista') return 'Folha - Lençóis'
  }
  return null
}

export const applyAutoTagging = (desc: string) => {
  const d = desc.toLowerCase()
  if (d.includes('taxa de administração') || d.includes('taxa de administracao'))
    return { category: 'Taxa Adm Locação', pbType: 'Receita' }
  if (d.includes('taxa contrato')) return { category: 'Taxa Contrato Locação', pbType: 'Receita' }
  if (
    d.includes('comissões vendas') ||
    d.includes('comissao venda') ||
    d.includes('comissão venda')
  )
    return { category: 'Comissões Vendas', pbType: 'Receita' }
  if (
    d.includes('pagamento comissões') ||
    d.includes('pagamento comissao') ||
    d.includes('pagamento comissão')
  )
    return { category: 'Comissões Pagas Vendas', pbType: 'Despesa Variável' }
  if (d.includes('irrf')) return { category: 'IRRF PJ', pbType: 'Despesa Variável' }
  if (d.includes('issqn')) return { category: 'ISSQN', pbType: 'Despesa Variável' }
  if (d.includes('simples nacional'))
    return { category: 'Simples Nacional', pbType: 'Despesa Variável' }
  if (d.includes('parcelamento simples'))
    return { category: 'Parcelamento Simples', pbType: 'Despesa Variável' }
  if (d.includes('honorários contábeis') || d.includes('honorarios contabeis'))
    return { category: 'Honorários Contábeis', pbType: 'Despesa Fixa' }
  if (
    d.includes('folha') ||
    d.includes('departamento') ||
    d.includes('pró labore') ||
    d.includes('pro labore')
  )
    return { category: 'Folha - Administrativo', pbType: 'Despesa Fixa' }
  if (d.includes('internet')) return { category: 'Internet', pbType: 'Despesa Fixa' }
  if (d.includes('telefonia')) return { category: 'Telefonia Móvel', pbType: 'Despesa Fixa' }
  if (d.includes('energia eletrica') || d.includes('energia elétrica') || d.includes('cpfl'))
    return { category: 'Energia Prédio', pbType: 'Despesa Fixa' }
  if (d.includes('agua e esgoto') || d.includes('água e esgoto') || d.includes('sabesp'))
    return { category: 'Água Prédio', pbType: 'Despesa Fixa' }
  if (d.includes('aluguel predio') || d.includes('aluguel prédio') || d.includes('novo mundo'))
    return { category: 'Aluguel Prédio', pbType: 'Despesa Fixa' }
  if (d.includes('facebook') || d.includes('google') || d.includes('rd station'))
    return { category: 'Marketing Digital', pbType: 'Despesa Variável' }
  if (d.includes('marketing') || d.includes('placas') || d.includes('faixas'))
    return { category: 'Marketing Impresso', pbType: 'Despesa Variável' }
  if (d.includes('doc') || d.includes('ted') || d.includes('tev'))
    return { category: 'Tarifa DOC/TED', pbType: 'Despesa Variável' }
  if (d.includes('tarifa') || d.includes('tarifas diversas'))
    return { category: 'Tarifas Bancárias', pbType: 'Despesa Variável' }
  if (d.includes('acordo') || d.includes('parcelamento'))
    return { category: 'Acordos e Parcelamentos', pbType: 'Despesa Variável' }
  if (d.includes('empréstimo') || d.includes('emprestimo') || d.includes('financiamento'))
    return { category: 'Empréstimo e Financiamento', pbType: 'Despesa Variável' }
  if (d.includes('combustível') || d.includes('combustivel') || d.includes('gasolina'))
    return { category: 'Combustível Vendas', pbType: 'Despesa Variável' }
  if (d.includes('multa por atraso')) return { category: 'Multa por Atraso', pbType: 'Receita' }
  if (d.includes('juros por atraso')) return { category: 'Juros por Atraso', pbType: 'Receita' }
  if (d.includes('seguro fiança') || d.includes('seguro fianca'))
    return { category: 'Seguro Fiança', pbType: 'Receita' }
  if (d.includes('manutenção') || d.includes('manutencao'))
    return { category: 'Manutenção Cobrada', pbType: 'Receita' }
  return { category: '', pbType: '' }
}
