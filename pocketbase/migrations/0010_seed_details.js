migrate(
  (app) => {
    try {
      const transactions = app.findRecordsByFilter('transactions', '1=1', '', 10000, 0)
      const uniqueDetails = new Map()
      for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i]
        const desc = t.get('description')
        const userId = t.get('user_id')
        if (desc && userId) {
          const key = `${userId}_${desc}`
          if (!uniqueDetails.has(key)) {
            uniqueDetails.set(key, { name: desc, user_id: userId })
          }
        }
      }

      const detailsCol = app.findCollectionByNameOrId('details')
      for (const val of uniqueDetails.values()) {
        try {
          const record = new Record(detailsCol)
          record.set('user_id', val.user_id)
          record.set('name', val.name)
          app.save(record)
        } catch (_) {
          // Ignore duplicates or errors
        }
      }
    } catch (e) {
      console.log('Error seeding details', e)
    }
  },
  (app) => {
    try {
      const detailsCol = app.findCollectionByNameOrId('details')
      app.truncateCollection(detailsCol)
    } catch (_) {}
  },
)
