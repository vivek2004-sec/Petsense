import client from './client'

export const analyzeApi = {
  image: async (file, petId, species = 'dog') => {
    const form = new FormData()
    form.append('file', file)
    form.append('species', species)
    if (petId) form.append('pet_id', petId)
    const { data } = await client.post('/analyze/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  audio: async (file, petId, species = 'dog') => {
    const form = new FormData()
    form.append('file', file)
    form.append('species', species)
    if (petId) form.append('pet_id', petId)
    const { data } = await client.post('/analyze/audio', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  combined: async (imageFile, audioFile, petId, species = 'dog') => {
    const form = new FormData()
    form.append('image_file', imageFile)
    form.append('audio_file', audioFile)
    form.append('species', species)
    if (petId) form.append('pet_id', petId)
    const { data } = await client.post('/analyze/combined', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
