routerAdd(
  'POST',
  '/backend/v1/details/{id}/rename',
  (e) => {
    const id = e.request.pathValue('id')
    const body = e.requestInfo().body
    const newName = body.newName
    const updateTransactions = body.updateTransactions

    if (!newName) {
      return e.badRequestError('newName is required')
    }

    const detail = $app.findRecordById('details', id)
    if (!detail) {
      return e.notFoundError('Detail not found')
    }

    const oldName = detail.get('name')

    detail.set('name', newName)
    $app.save(detail)

    if (updateTransactions) {
      const userId = e.auth.id
      $app
        .db()
        .newQuery(
          'UPDATE transactions SET description = {:newName} WHERE description = {:oldName} AND user_id = {:userId}',
        )
        .bind({ newName: newName, oldName: oldName, userId: userId })
        .execute()
    }

    return e.json(200, detail)
  },
  $apis.requireAuth(),
)
