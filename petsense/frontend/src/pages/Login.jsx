import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PawPrint, Mail, Lock, LogIn, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import GoogleAuthButton from '../components/GoogleAuthButton'
import FormField from '../components/FormField'
import toast from 'react-hot-toast'

export default function Login() {
  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back! 🐾')
      navigate('/dashboard')
    } catch (err) {
      if (!err.response) {
        toast.error('Cannot connect to backend server. Check VITE_API_URL on Vercel.')
      } else {
        toast.error(err.response?.data?.detail || 'Invalid email or password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-grid">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="auth-panel">
          <div className="relative z-10 space-y-6">
            <div className="brand-mark">
              <PawPrint size={24} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-fg leading-snug">
              Understand your pet<br /><span className="text-accent">like never before</span>
            </h2>
            <ul className="space-y-3 text-muted text-sm">
              {['Disease & skin analysis from photos', 'Emotion & pain detection', 'Personalized care advice'].map(t => (
                <li key={t} className="flex items-center gap-2.5">
                  <Sparkles size={15} className="text-accent shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="auth-card">
          <div className="auth-card-header">
            <h1 className="text-2xl font-bold text-fg">Welcome back</h1>
            <p className="text-muted text-sm mt-1">Sign in to your PetSense account</p>
          </div>

          <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
            <FormField
              id="login-email"
              label="Email"
              type="email"
              icon={Mail}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <FormField
              id="login-password"
              label="Password"
              icon={Lock}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              showToggle
              showPassword={showPw}
              onTogglePassword={() => setShowPw(!showPw)}
            />
            <button id="login-submit-btn" type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? <span className="btn-spinner" /> : <LogIn size={17} />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <GoogleAuthButton mode="login" />

          <p className="text-center text-muted text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:underline font-medium">Create one free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
