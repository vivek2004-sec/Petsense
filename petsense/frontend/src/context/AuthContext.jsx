import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('petsense_token')
    if (token) {
      authApi.me()
        .then(u => setUser(u))
        .catch(() => localStorage.removeItem('petsense_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const data = await authApi.login(email, password)
    localStorage.setItem('petsense_token', data.access_token)
    setUser(data.user)
    return data
  }

  const register = async (email, password, fullName) => {
    const data = await authApi.register(email, password, fullName)
    localStorage.setItem('petsense_token', data.access_token)
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('petsense_token')
    setUser(null)
  }

  const updateConsent = async (consent) => {
    const updated = await authApi.updateConsent(consent)
    setUser(updated)
    return updated
  }

  const googleLogin = async (token) => {
    const data = await authApi.googleLogin(token)
    localStorage.setItem('petsense_token', data.access_token)
    setUser(data.user)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateConsent, googleLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
