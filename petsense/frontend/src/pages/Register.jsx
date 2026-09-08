import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PawPrint, Mail, Lock, User, UserPlus, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { GoogleLogin } from '@react-oauth/google'
import FormField from '../components/FormField'
import toast from 'react-hot-toast'

export default function Register() {
  const { register, googleLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ fullName: '', email: '', password: '', confirmPw: '' })
  const [showPw, setShowPw]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPw) { setError("Passwords don't match"); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await register(form.email, form.password, form.fullName)
      toast.success('Account created! 🐾 Welcome to PetSense')
      navigate('/dashboard')
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to backend server. Ensure VITE_API_URL is set in Vercel environment variables and Render backend is awake.')
      } else {
        setError(err.response?.data?.detail || 'Registration failed. Please try again.')
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
              Join caring<br /><span className="text-accent">pet owners</span>
            </h2>
            <ul className="space-y-3 text-muted text-sm">
              {['Free AI pet health screening', 'Disease detection from photos', 'Track wellness over time'].map(t => (
                <li key={t} className="flex items-center gap-2.5">
                  <Sparkles size={15} className="text-accent shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="auth-card">
          <div className="auth-card-header">
            <h1 className="text-2xl font-bold text-fg">Create account</h1>
            <p className="text-muted text-sm mt-1">Start understanding your pet — it's free</p>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <form id="register-form" onSubmit={handleSubmit} className="space-y-5">
            <FormField
              id="reg-name"
              label="Full Name"
              optional
              icon={User}
              value={form.fullName}
              onChange={set('fullName')}
              placeholder="Jane Smith"
              autoComplete="name"
            />
            <FormField
              id="reg-email"
              label="Email"
              type="email"
              icon={Mail}
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
            <FormField
              id="reg-password"
              label="Password"
              icon={Lock}
              value={form.password}
              onChange={set('password')}
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
              showToggle
              showPassword={showPw}
              onTogglePassword={() => setShowPw(!showPw)}
            />
            <FormField
              id="reg-confirm"
              label="Confirm Password"
              icon={Lock}
              value={form.confirmPw}
              onChange={set('confirmPw')}
              placeholder="Repeat your password"
              required
              autoComplete="new-password"
              showToggle
              showPassword={showConfirm}
              onTogglePassword={() => setShowConfirm(!showConfirm)}
            />
            <button id="register-submit-btn" type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? <span className="btn-spinner" /> : <UserPlus size={17} />}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={async (cr) => { try { await googleLogin(cr.credential); toast.success('Welcome! 🐾'); navigate('/dashboard') } catch (err) { toast.error(err.response?.data?.detail || 'Google sign up failed') } }}
              onError={() => toast.error('Google sign up failed')}
              theme="filled_black" shape="pill" size="large" width="100%"
            />
          </div>

          <p className="text-center text-muted text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>
          <p className="text-center text-subtle text-xs leading-relaxed">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="text-accent/80 hover:underline">Terms</Link> and{' '}
            <Link to="/privacy" className="text-accent/80 hover:underline">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
