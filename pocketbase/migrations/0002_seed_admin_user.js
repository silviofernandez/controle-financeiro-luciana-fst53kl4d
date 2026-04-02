migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    try {
      app.findAuthRecordByEmail('users', 'gabsilvio@gmail.com')
      return
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('gabsilvio@gmail.com')
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Admin')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'gabsilvio@gmail.com')
      app.delete(record)
    } catch (_) {}
  },
)
