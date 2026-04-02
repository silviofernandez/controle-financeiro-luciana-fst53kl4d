migrate(
  (app) => {
    const collection = new Collection({
      name: 'transactions',
      type: 'base',
      listRule: "@request.auth.id != '' && user_id = @request.auth.id",
      viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'description', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true },
        { name: 'date', type: 'date', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['Receita', 'Despesa Fixa', 'Despesa Variável'],
          maxSelect: 1,
        },
        { name: 'category', type: 'text', required: true },
        {
          name: 'unit',
          type: 'select',
          required: true,
          values: ['Jaú', 'Pederneiras', 'Lençóis Paulista', 'Geral', 'Silvio'],
          maxSelect: 1,
        },
        { name: 'bank', type: 'text' },
        { name: 'observations', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_transactions_user_type_date ON transactions (user_id, type, date)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('transactions')
    app.delete(collection)
  },
)
