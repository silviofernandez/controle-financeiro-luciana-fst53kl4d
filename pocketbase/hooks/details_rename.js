routerAdd(
  'POST',
  '/backend/v1/details/{id}/rename',
  (e) => {
    const id = e.request.pathValue('id')
    const body = e.requestInfo().body
    const newName = body.newName
    const oldName = body.oldName
    const updateAll = body.updateAll === true

    if (!newName) {
      throw new BadRequestError('newName is required')
    }

    return $app.runInTransaction((txApp) => {
      const detail = txApp.findRecordById('details', id)

      // Check if another detail with the same name already exists for this user
      try {
        const existing = txApp.findFirstRecordByFilter(
          'details',
          'user_id = {:userId} && name = {:name} && id != {:id}',
          {
            userId: detail.get('user_id'),
            name: newName,
            id: id,
          },
        )
        if (existing) {
          throw new BadRequestError('Detail name already exists')
        }
      } catch (_) {
        // Not found, we can proceed
      }

      detail.set('name', newName)
      txApp.save(detail)

      if (updateAll && oldName) {
        txApp
          .db()
          .newQuery(
            'UPDATE transactions SET description = {:newName} WHERE description = {:oldName} AND user_id = {:userId}',
          )
          .bind({
            newName: newName,
            oldName: oldName,
            userId: detail.get('user_id'),
          })
          .execute()
      }

      return e.json(200, { success: true })
    })
  },
  $apis.requireAuth(),
)
