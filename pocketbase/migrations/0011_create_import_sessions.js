migrate(
  (app) => {
    const collection = new Collection({
      name: 'import_sessions',
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
        { name: 'file_name', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['In Progress', 'Completed', 'Interrupted'],
          maxSelect: 1,
        },
        { name: 'raw_data', type: 'json' },
        { name: 'triage_state', type: 'json' },
        { name: 'last_position', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('import_sessions')
    app.delete(collection)
  },
)
