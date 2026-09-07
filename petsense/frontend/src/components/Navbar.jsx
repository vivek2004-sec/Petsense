import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { PawPrint, Menu, X, Camera, Upload, LayoutDashboard, LogOut, User } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navLinks = user ? [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/scan/live',   label: 'Live Scan',  icon: Camera },
    { to: '/scan/upload', label: 'Upload',      icon: Upload },
  ] : []

  const isActive = (path) => location.pathname === path

  if (location.pathname === '/' && !user) return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-surface-border bg-[#0E1217]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
              <PawPrint size={17} className="text-accent" />
            </div>
            <span className="font-display font-bold text-lg text-accent">PetSense</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-surface border border-surface-border">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'bg-accent/15 text-accent'
                    : 'text-muted hover:text-fg hover:bg-white/5'
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/4 border border-white/8">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-teal/30 to-purple/30 flex items-center justify-center">
                    <User size={12} className="text-teal" />
                  </div>
                  <span className="text-white/60 text-sm font-medium max-w-[120px] truncate">
                    {user.full_name || user.email.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-rose hover:bg-rose/10 transition-all"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary py-2 px-4 text-sm">Sign in</Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm">Get Started</Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 overflow-hidden bg-navy/90 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive(to) ? 'bg-teal/15 text-teal border border-teal/20' : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              ))}
              {user ? (
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-rose hover:bg-rose/10 transition-all mt-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              ) : (
                <div className="flex gap-2 pt-3">
                  <Link to="/login"    onClick={() => setMobileOpen(false)} className="btn-secondary py-2.5 px-4 text-sm flex-1 justify-center">Sign in</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary py-2.5 px-4 text-sm flex-1 justify-center">Get Started</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
