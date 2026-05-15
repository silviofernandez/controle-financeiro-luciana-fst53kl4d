migrate(
  (app) => {
    const collection = new Collection({
      name: 'contas_pagar',
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
        { name: 'descricao', type: 'text', required: true },
        { name: 'valor', type: 'number', required: true },
        { name: 'vencimento', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Pendente', 'Pago'],
          maxSelect: 1,
        },
        { name: 'unidade', type: 'text', required: false },
        { name: 'category', type: 'text', required: false },
        { name: 'banco', type: 'text', required: false },
        { name: 'recorrente', type: 'bool', required: false },
        { name: 'recorrencia_dia', type: 'number', required: false },
        { name: 'recorrencia_meses', type: 'number', required: false },
        { name: 'observacoes', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_contas_pagar_user_date ON contas_pagar (user_id, vencimento)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('contas_pagar')
    app.delete(collection)
  },
)
