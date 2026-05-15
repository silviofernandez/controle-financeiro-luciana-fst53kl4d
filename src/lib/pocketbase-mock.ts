const pbMock = {
  collection: (name: string) => ({
    getFullList: async () => [],
    getList: async () => ({ items: [], totalItems: 0, page: 1, perPage: 20, totalPages: 0 }),
    getOne: async () => ({}),
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
  }),
  authStore: {
    record: null,
    onChange: () => () => {},
    clear: () => {},
  },
  send: async () => ({}),
}

export default pbMock
