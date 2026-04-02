migrate(
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'gabsilvio@gmail.com')
      app.delete(record)
    } catch (_) {
      // user not found, nothing to delete
    }
  },
  (app) => {
    try {
      app.findAuthRecordByEmail('users', 'gabsilvio@gmail.com')
    } catch (_) {
      const users = app.findCollectionByNameOrId('users')
      const record = new Record(users)
      record.setEmail('gabsilvio@gmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin')
      app.save(record)
    }
  },
)
