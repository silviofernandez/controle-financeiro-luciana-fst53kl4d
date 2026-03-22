import { Transaction, Banco, Unidade, TransactionType, ClassificacaoDespesa } from '@/types'

const guessBank = (desc: string): Banco => {
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

const rawFebData = `02/02|Jau|1610|up talentos , recrutamento santander|despesa|variavel|
02/02|Jau|3758.79|fgts multa 40% gabriela martins santander|despesa|variavel|
02/02|Jau|287.99|quires inovancao plcas qrcode santander|despesa|variavel|
02/02|Silvio|150|prolabore concerto roda volvo santander|despesa|fixo|
02/02|Pederneiras|146.68|agua sabesp janeiro santander|despesa|fixo|
02/02|Jau|716.78|iptu atrasados 4/24 santander|despesa|fixo|
02/02|Jau|40|exame admissional marina d financeiro|despesa|variavel|
02/02|Jau|40|exame admissional gabriela siriani d financeiro|despesa|variavel|
02/02|Jau|94.8|cafe da manha 02/02 d financeiro|despesa|variavel|
02/02|Pederneiras|23.9|despesa refeicao ruan 03/02 d financeiro|despesa|variavel|
02/02|Jau|142|despesa copa copos big festa d financeiro|despesa|variavel|
02/02|Jau|28|despesa refeicao leonardo lencois d financeiro|despesa|variavel|
02/02|Jau|20|despesa refeicao eduardo lencois d financeiro|despesa|variavel|
02/02|Jau|200|paroquia nossa senhora santander|despesa|variavel|
03/02|L. Paulista|635.74|vivo lencois santander|despesa|fixo|
03/02|Jau|273.67|rescisao gabriela martins inter|despesa|variavel|
03/02|Jau|202.66|cesta de janeiro gabriela martins|despesa|variavel|
03/02|Jau|380|flash cesta kgb santander|despesa|variavel|
03/02|Jau|5320|flash cesta la baccaro santander|despesa|variavel|
03/02|Geral|2817.45|saldo financeiro|receita||true
04/02|Jau|75.6|sacolas de aniversarios d financeiro|despesa|variavel|
04/02|Geral|4012.07|saldo financeiro|receita||true
05/02|Jau|380|flash cesta bruna tiburcio santander|despesa|variavel|
05/02|Jau|50|doacao casa da crianca d financeiro|despesa|variavel|
05/02|Geral|3962.07|saldo financeiro|receita||true
06/02|Jau|160|trasnf p/ pedro 4 exames medicos santander|despesa|variavel|
06/02|Jau|100|trasnf p/ pedro 4 acerto gabriela dias|despesa|variavel|
06/02|Jau|1657.18|multa fgts 40% gabriela dias santander|despesa|variavel|
06/02|Jau|2960.15|sal gustavo inter|despesa|fixo|
06/02|Jau|6893.03|sal elisangela inter|despesa|fixo|
06/02|Jau|1092.25|sal stephany inter|despesa|fixo|
06/02|Jau|2062.63|sal ruan inter|despesa|fixo|
06/02|Jau|1051.32|sal rosileia inter|despesa|fixo|
06/02|Jau|679.85|sal natanny inter|despesa|fixo|
06/02|Jau|2108.23|sal mariana nardello inter|despesa|fixo|
06/02|Jau|1534.87|sal leticia inter|despesa|fixo|
06/02|Jau|2218.62|sal victor scalco inter|despesa|fixo|
06/02|Jau|1456.32|sal victor silva inter|despesa|fixo|
06/02|Jau|2814.62|sal guilherme libanorio inter|despesa|fixo|
06/02|Jau|1332.74|sal isabela couto inter|despesa|fixo|
06/02|Jau|1065.53|sal bruna carolina inter|despesa|fixo|
06/02|Jau|2480|sal pedro inter|despesa|fixo|
06/02|Jau|1206.32|sal gabriela dias|despesa|fixo|
06/02|Pederneiras|1775.5|sal maria eduarda inter|despesa|fixo|
06/02|Pederneiras|2497.46|sal beatriz inter|despesa|fixo|
06/02|L. Paulista|2311.94|sal emanuelly inter|despesa|fixo|
06/02|Jau|1471.64|ferias 10 dias de dezembro pg total santander|despesa|fixo|
06/02|Silvio|380|vale transporte adriana d financeiro|despesa|fixo|
06/02|Silvio|2210.32|salario adriana inter|despesa|fixo|
06/02|Jau|121|despesa juridico d financeiro|despesa|variavel|
06/02|Geral|3461.07|saldo financeiro|receita||true
07/02|Jau|2000|ajuda de custo jessica inter|despesa|fixo|
07/02|Jau|5000|ajuda de custo gabriel inter|despesa|fixo|
07/02|Jau|2075|parcela 3 g4 trasnf cris santander|despesa|fixo|
07/02|Silvio|250|prolabore sebastiao peixes santander|despesa|fixo|
07/02|Jau|488.7|up talentos boleto vaga apoio santander|despesa|variavel|
07/02|Silvio|445.47|caicara clube janeiro santander|despesa|fixo|
07/02|Jau|319.94|leovaldo preto 312,74 santander|despesa|variavel|
07/02|Jau|250|doacao catedral n senhora santander|despesa|variavel|
09/02|Jau|148.99|leovaldo preto 145,63 santander|despesa|variavel|
09/02|Jau|119.21|leovaldo preto 116,53 santander|despesa|variavel|
09/02|Jau|175.62|vanderson pacheco santander|despesa|variavel|
09/02|Jau|2650|up talentos recrutamento jose humberto santand|despesa|variavel|
09/02|Pederneiras|45|cdl pederneiras santander|despesa|variavel|
09/02|Jau|87|vivo smart empresas santander|despesa|fixo|
09/02|Jau|100|rescisao gabriel dias santander|despesa|variavel|
09/02|Geral|4041.71|saldo financeiro|receita||true
10/02|Geral|320000|Faturamento Geral Fevereiro|receita||
10/02|Jau|3200|maya atendimento santander|despesa|variavel|
10/02|Jau|184.11|hospedaria santander|despesa|variavel|
10/02|Jau|824.2|ferrucci santander|despesa|fixo|
10/02|Jau|5255.6|integrale santander|despesa|variavel|
10/02|Jau|438.58|linstel mais zap santander|despesa|variavel|
10/02|Jau|405.71|luci dalva santander|despesa|variavel|
10/02|Jau|356.34|unimed func santander|despesa|fixo|
10/02|Jau|600.48|tecnosuper santander|despesa|variavel|
10/02|Jau|153.52|imovpago santander|despesa|fixo|
10/02|Jau|323.63|discovery solucoes santander|despesa|variavel|
10/02|Jau|4674.15|lastro tecnologia santander|despesa|variavel|
10/02|Jau|456.36|maqmiller santander|despesa|variavel|
10/02|L. Paulista|600|faxina neuma santander 4|despesa|variavel|
10/02|L. Paulista|114.53|assoc comercial santander|despesa|fixo|
10/02|Pederneiras|591.55|vania elvira rossini santander. 2/2|despesa|variavel|
10/02|Pederneiras|99.9|vero santander|despesa|fixo|
10/02|Pederneiras|144.7|maq miller santander|despesa|variavel|
10/02|Pederneiras|2000|ajuda de custo giovanni santander|despesa|fixo|
10/02|Pederneiras|160|linetel santander|despesa|variavel|
10/02|Silvio|2895.85|unimed corporativo santander|despesa|fixo|
10/02|Silvio|20|vigia noturno d financeiro|despesa|variavel|
10/02|Pederneiras|79.8|despesa refeicao ruan. mariana d financeiro|despesa|variavel|
10/02|Geral|16.53|ajuste de caixa dinh faltando|despesa|variavel|
10/02|Geral|2835|saldo financeiro|receita||true
11/02|Jau|1197.23|multa fgts 40% bruna tiburcio santander|despesa|variavel|
11/02|Jau|1200|adiantamento rose btg|despesa|fixo|
11/02|Jau|1047.6|yak placas 2/4 santander|despesa|variavel|
11/02|L. Paulista|1400|aluguel eduardo ferrucci santander|despesa|fixo|
11/02|Jau|200|prolabore pedro d financeiro|despesa|fixo|
11/02|Jau|0.09|desconto recebimento d financeiro|despesa|variavel|
11/02|Geral|4505.4|saldo financeiro|receita||true
12/02|Jau|4384.71|vox cartao tenda santander|despesa|variavel|
12/02|Jau|269.79|dev de farmacia bruna tiburcio inter|despesa|variavel|
12/02|Jau|4224.82|rescisao bruna tiburcio inter|despesa|variavel|
12/02|Jau|214.88|tokio marine seguro santander|despesa|fixo|
12/02|Jau|2696.75|transf santander luciana nu pag juros murilo|despesa|variavel|
12/02|Silvio|737.08|cartao santander victor santander|despesa|variavel|
12/02|Geral|1185.35|saldo financeiro|receita||true
13/02|Jau|4000|marketing maicon santander|despesa|fixo|
13/02|L. Paulista|2000|ajuda de custo eduardo ferrucci santander|despesa|fixo|
13/02|Silvio|300|transferecia santander luciana inter|despesa|variavel|
13/02|Silvio|20|doacao nosso lar d financeiro|despesa|variavel|
13/02|Geral|1508.14|saldo financeiro|receita||true
13/02|Silvio|298.24|claro casa silvio santander|despesa|fixo|
16/02|Silvio|2000|transferencia santander luciana inter|despesa|variavel|
16/02|Silvio|3900|transferencia btg luciana inter|despesa|variavel|
16/02|Silvio|900|rosa lavanderia santander|despesa|variavel|
16/02|Jau|250|outros jau|despesa|variavel|`

export const getMockData = (): Transaction[] => {
  const janData: Transaction[] = [
    {
      id: '1',
      tipo: 'despesa',
      descricao: 'Custos Operacionais Jau',
      valor: 184000,
      data: '2026-01-15T10:00:00.000Z',
      categoria: 'Outros',
      unidade: 'Jau',
      banco: 'Santander',
      classificacao: 'fixo',
      created_at: '2026-01-15T10:00:00.000Z',
    },
    {
      id: '2',
      tipo: 'despesa',
      descricao: 'Folha e Fornecedores Pederneiras',
      valor: 10500,
      data: '2026-01-16T10:00:00.000Z',
      categoria: 'Folha de Pagamento',
      unidade: 'Pederneiras',
      banco: 'Inter',
      classificacao: 'fixo',
      created_at: '2026-01-16T10:00:00.000Z',
    },
    {
      id: '3',
      tipo: 'despesa',
      descricao: 'Manutenção L. Paulista',
      valor: 16700,
      data: '2026-01-17T10:00:00.000Z',
      categoria: 'Fornecedores',
      unidade: 'L. Paulista',
      banco: 'BTG',
      classificacao: 'variavel',
      created_at: '2026-01-17T10:00:00.000Z',
    },
    {
      id: '4',
      tipo: 'despesa',
      descricao: 'Despesas Silvio',
      valor: 39600,
      data: '2026-01-18T10:00:00.000Z',
      categoria: 'Outros',
      unidade: 'Silvio',
      banco: 'Nubank',
      classificacao: 'variavel',
      created_at: '2026-01-18T10:00:00.000Z',
    },
    {
      id: '5',
      tipo: 'receita',
      descricao: 'Faturamento Geral Jan',
      valor: 300000,
      data: '2026-01-20T10:00:00.000Z',
      categoria: 'Trabalho',
      unidade: 'Geral',
      banco: 'Santander',
      created_at: '2026-01-20T10:00:00.000Z',
    },
    {
      id: '6',
      tipo: 'receita',
      descricao: 'Saldo Financeiro Fechamento',
      valor: 49200,
      data: '2026-01-31T23:59:59.000Z',
      categoria: 'Outros',
      unidade: 'Geral',
      banco: 'Outros',
      isCheckpoint: true,
      created_at: '2026-01-31T23:59:59.000Z',
    },
  ]

  const febParsed = rawFebData
    .split('\n')
    .filter(Boolean)
    .map((line, i) => {
      const [dateStr, und, valStr, desc, tipo, classif, isChk] = line.split('|')
      const [day, month] = dateStr.trim().split('/')
      return {
        id: `feb-${i}`,
        tipo: tipo as TransactionType,
        descricao: desc.trim(),
        valor: parseFloat(valStr),
        data: `2026-${month}-${day}T10:00:00.000Z`,
        categoria: 'Outros',
        unidade: und as Unidade,
        banco: guessBank(desc),
        classificacao: classif ? (classif as ClassificacaoDespesa) : null,
        isCheckpoint: isChk === 'true',
        created_at: new Date().toISOString(),
      }
    })

  return [...janData, ...febParsed]
}
