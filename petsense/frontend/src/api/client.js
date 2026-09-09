import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
})

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('petsense_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirect to login on 401 for protected endpoints
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const requestUrl = err.config?.url || ''
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/google')
      const isAuthPage =
        window.location.pathname === '/login' ||
        window.location.pathname === '/register'

      if (!isAuthEndpoint && !isAuthPage) {
        localStorage.removeItem('petsense_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default client
