import client from './client'

export const authApi = {
  register: async (email, password, fullName) => {
    const { data } = await client.post('/auth/register', { email, password, full_name: fullName })
    return data
  },
  login: async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password })
    return data
  },
  me: async () => {
    const { data } = await client.get('/auth/me')
    return data
  },
  updateConsent: async (dataConsent) => {
    const { data } = await client.patch('/auth/me/consent', { data_consent: dataConsent })
    return data
  },
  googleLogin: async (token) => {
    const { data } = await client.post('/auth/google', { token })
    return data
  },
}
