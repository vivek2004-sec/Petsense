import client from './client'

export const scansApi = {
  list: async (petId, limit = 50, offset = 0) => {
    const params = { limit, offset }
    if (petId) params.pet_id = petId
    const { data } = await client.get('/scans', { params })
    return data
  },
  get: async (scanId) => {
    const { data } = await client.get(`/scans/${scanId}`)
    return data
  },
  delete: async (scanId) => {
    await client.delete(`/scans/${scanId}`)
  },
}
