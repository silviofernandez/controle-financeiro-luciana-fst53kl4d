migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      const existing = app.findAuthRecordByEmail('users', 'gabsilvio@gmail.com')
      // Update password just in case it was wrong or different
      existing.setPassword('Skip@Pass')
      existing.setVerified(true)
      app.save(existing)
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
    // Revert is a no-op to avoid accidentally deleting the user if they were already created
    // and are being actively used
  },
)
