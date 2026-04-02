migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('transactions')
    app.truncateCollection(col)
  },
  (app) => {
    // Down migration: Cannot restore truncated data
  },
)
