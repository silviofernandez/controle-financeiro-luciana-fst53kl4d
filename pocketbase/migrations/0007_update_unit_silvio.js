migrate(
  (app) => {
    // Update collection schema
    const collection = app.findCollectionByNameOrId('transactions')
    const unitField = collection.fields.getByName('unit')
    if (unitField) {
      const newValues = unitField.values.map((v) =>
        v === 'Silvio' ? 'Pró-labore (Silvio/Luciana)' : v,
      )
      if (!newValues.includes('Pró-labore (Silvio/Luciana)')) {
        newValues.push('Pró-labore (Silvio/Luciana)')
      }
      unitField.values = newValues
      app.save(collection)
    }

    // Update existing data
    app
      .db()
      .newQuery(
        "UPDATE transactions SET unit = 'Pró-labore (Silvio/Luciana)' WHERE unit = 'Silvio'",
      )
      .execute()
  },
  (app) => {
    // Revert data
    app
      .db()
      .newQuery(
        "UPDATE transactions SET unit = 'Silvio' WHERE unit = 'Pró-labore (Silvio/Luciana)'",
      )
      .execute()

    // Revert collection schema
    const collection = app.findCollectionByNameOrId('transactions')
    const unitField = collection.fields.getByName('unit')
    if (unitField) {
      unitField.values = unitField.values.map((v) =>
        v === 'Pró-labore (Silvio/Luciana)' ? 'Silvio' : v,
      )
      app.save(collection)
    }
  },
)
