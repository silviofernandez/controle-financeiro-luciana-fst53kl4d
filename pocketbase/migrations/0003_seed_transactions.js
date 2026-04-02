migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    let user
    try {
      user = app.findAuthRecordByEmail('users', 'gabsilvio@gmail.com')
    } catch (_) {
      return
    }

    const transactions = app.findCollectionByNameOrId('transactions')

    const seedData = [
      {
        description: 'Aluguel Prédio Jaú',
        amount: 5000,
        date: '2026-02-01 10:00:00.000Z',
        type: 'Despesa Fixa',
        category: 'Aluguel Prédio',
        unit: 'Jaú',
        bank: 'Santander',
      },
      {
        description: 'Comissão Venda Casa',
        amount: 15000,
        date: '2026-02-05 10:00:00.000Z',
        type: 'Receita',
        category: 'Comissões Vendas',
        unit: 'Jaú',
        bank: 'Inter',
      },
      {
        description: 'Energia Prédio Pederneiras',
        amount: 800,
        date: '2026-02-10 10:00:00.000Z',
        type: 'Despesa Fixa',
        category: 'Energia Prédio',
        unit: 'Pederneiras',
        bank: 'Caixa',
      },
      {
        description: 'Marketing Facebook',
        amount: 2000,
        date: '2026-02-15 10:00:00.000Z',
        type: 'Despesa Variável',
        category: 'Marketing Digital',
        unit: 'Geral',
        bank: 'Nubank',
      },
      {
        description: 'Taxa Adm Locação',
        amount: 3500,
        date: '2026-02-20 10:00:00.000Z',
        type: 'Receita',
        category: 'Taxa Adm Locação',
        unit: 'Lençóis Paulista',
        bank: 'BTG',
      },
    ]

    for (const data of seedData) {
      try {
        app.findFirstRecordByData('transactions', 'description', data.description)
      } catch (_) {
        const record = new Record(transactions)
        record.set('user_id', user.id)
        record.set('description', data.description)
        record.set('amount', data.amount)
        record.set('date', data.date)
        record.set('type', data.type)
        record.set('category', data.category)
        record.set('unit', data.unit)
        record.set('bank', data.bank)
        app.save(record)
      }
    }
  },
  (app) => {},
)
