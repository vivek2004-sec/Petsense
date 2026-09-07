import client from './client'

export const petsApi = {
  create: async (petData) => {
    const { data } = await client.post('/pets', petData)
    return data
  },
  list: async () => {
    const { data } = await client.get('/pets')
    return data
  },
  get: async (petId) => {
    const { data } = await client.get(`/pets/${petId}`)
    return data
  },
  update: async (petId, petData) => {
    const { data } = await client.patch(`/pets/${petId}`, petData)
    return data
  },
  delete: async (petId) => {
    await client.delete(`/pets/${petId}`)
  },
  uploadPhoto: async (petId, file) => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await client.post(`/pets/${petId}/photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
  history: async (petId, limit = 100) => {
    const { data } = await client.get(`/scans/pets/${petId}/history`, { params: { limit } })
    return data
  },
}
