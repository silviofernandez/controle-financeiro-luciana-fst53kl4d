migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('transactions')
    const cardsCol = app.findCollectionByNameOrId('credit_cards')
    col.fields.add(
      new RelationField({
        name: 'card_id',
        collectionId: cardsCol.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('transactions')
    col.fields.removeByName('card_id')
    app.save(col)
  },
)
