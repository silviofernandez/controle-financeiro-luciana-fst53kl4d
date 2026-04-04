routerAdd(
  'POST',
  '/backend/v1/transactions/duplicates',
  (e) => {
    const body = e.requestInfo().body || {}
    const userId = e.auth?.id

    if (!userId) {
      throw new UnauthorizedError('Authentication required.')
    }

    // Fetch all transactions for this user, ordered by creation (oldest first)
    const records = $app.findRecordsByFilter(
      'transactions',
      'user_id = {:userId}',
      'created ASC',
      100000,
      0,
      { userId: userId },
    )

    const seen = {}
    const duplicates = []
    let totalAmount = 0

    for (let i = 0; i < records.length; i++) {
      const record = records[i]

      // Normalize date to YYYY-MM-DD for comparison
      const rawDate = record.get('date').toString()
      const dateVal = rawDate.length >= 10 ? rawDate.substring(0, 10) : rawDate

      // Normalize description
      const desc = (record.get('description') || '').toString().trim().toLowerCase()

      // Normalize amount
      const amount = Number(record.get('amount') || 0)

      const key = dateVal + '_' + amount + '_' + desc

      if (seen[key]) {
        // It's a duplicate, mark for deletion
        duplicates.push(record)
        totalAmount += amount
      } else {
        // First time seeing this combination, keep it
        seen[key] = true
      }
    }

    // If dryRun is true, just return the stats
    if (body.dryRun) {
      return e.json(200, { count: duplicates.length, totalAmount: totalAmount })
    }

    // If not dryRun, perform deletion safely in a transaction
    let deletedCount = 0
    $app.runInTransaction((txApp) => {
      for (let i = 0; i < duplicates.length; i++) {
        txApp.delete(duplicates[i])
        deletedCount++
      }
    })

    return e.json(200, { count: deletedCount, totalAmount: totalAmount })
  },
  $apis.requireAuth(),
)
