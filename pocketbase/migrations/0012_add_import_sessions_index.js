migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('import_sessions')
    col.addIndex('idx_import_sessions_user_status', false, 'user_id,status', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('import_sessions')
    col.removeIndex('idx_import_sessions_user_status')
    app.save(col)
  },
)
