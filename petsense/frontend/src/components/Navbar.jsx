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
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-navy/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal/20 to-teal/5 border border-teal/20 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(0,212,180,0.3)] group-hover:-rotate-3 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <PawPrint size={18} className="text-accent relative z-10" />
            </div>
            <span className="font-display font-bold text-lg text-fg group-hover:text-accent transition-colors duration-300">
                Pet<span className="text-accent">Sense</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 p-1.5 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = isActive(to)
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active ? 'text-accent' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="navbar-active-bg"
                      className="absolute inset-0 bg-teal/10 border border-teal/20 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon size={16} className="relative z-10" />
                  <span className="relative z-10">{label}</span>
                </Link>
              )
            })}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal to-purple/80 p-[1px]">
                     <div className="w-full h-full bg-navy rounded-[7px] flex items-center justify-center">
                        <User size={14} className="text-teal" />
                     </div>
                  </div>
                  <span className="text-white/80 text-sm font-medium max-w-[120px] truncate">
                    {user.full_name || user.email.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-white/50 hover:text-rose hover:bg-rose/10 transition-all duration-200"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary py-2 px-5 text-sm">Sign in</Link>
                <Link to="/register" className="btn-primary py-2 px-5 text-sm">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0 }}
            className="md:hidden border-t border-white/10 overflow-hidden bg-navy/95 backdrop-blur-xl shadow-2xl"
          >
            <div className="px-4 py-6 space-y-2">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive(to) 
                        ? 'bg-gradient-to-r from-teal/20 to-transparent text-teal border-l-2 border-teal' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
              {user ? (
                <div className="pt-4 mt-2 border-t border-white/5">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <User size={18} className="text-white/60" />
                        </div>
                        <div>
                            <p className="text-white font-medium">{user.full_name || 'User'}</p>
                            <p className="text-white/40 text-xs">{user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { handleLogout(); setMobileOpen(false) }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-rose hover:bg-rose/10 transition-all mt-2"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                  <Link to="/login"    onClick={() => setMobileOpen(false)} className="btn-secondary py-3 px-4 text-sm justify-center w-full">Sign in</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary py-3 px-4 text-sm justify-center w-full">Get Started</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
