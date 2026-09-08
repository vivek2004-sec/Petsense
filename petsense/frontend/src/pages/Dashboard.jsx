import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Camera, Upload, Clock, PawPrint, Heart, AlertTriangle, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { petsApi }  from '../api/pets'
import { scansApi } from '../api/scans'
import PetCard      from '../components/PetCard'
import ResultCard   from '../components/ResultCard'
import PageHeader   from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import toast from 'react-hot-toast'

const STATS = [
  { key: 'pets',    label: 'My Pets',      icon: PawPrint,       color: 'text-teal', bg: 'bg-teal/10 border-teal/20' },
  { key: 'scans',   label: 'Total Scans',  icon: Camera,         color: 'text-purple', bg: 'bg-purple/10 border-purple/20' },
  { key: 'happy',   label: 'Happy Moments', icon: Heart,         color: 'text-amber', bg: 'bg-amber/10 border-amber/20' },
  { key: 'alerts',  label: 'Health Alerts', icon: AlertTriangle, color: 'text-rose', bg: 'bg-rose/10 border-rose/20' },
]

// Animated Counter
function AnimatedStat({ end }) {
    const [count, setCount] = useState(0)
    
    useEffect(() => {
      let start = 0
      const duration = 1500
      const increment = end / (duration / 16)
      const timer = setInterval(() => {
        start += increment
        if (start >= end) {
          setCount(end)
          clearInterval(timer)
        } else {
          setCount(Math.floor(start))
        }
      }, 16)
      return () => clearInterval(timer)
    }, [end])
  
    return <span>{count}</span>
}

export default function Dashboard() {
  const { user } = useAuth()
  const [pets, setPets]         = useState([])
  const [recentScans, setScans] = useState([])
  const [loading, setLoading]   = useState(true)
  const [petScans, setPetScans] = useState({})

  useEffect(() => {
    async function load() {
      try {
        const [petsData, scansData] = await Promise.all([
          petsApi.list(),
          scansApi.list(null, 10),
        ])
        setPets(petsData)
        setScans(scansData)
        const map = {}
        scansData.forEach(s => { if (s.pet_id && !map[s.pet_id]) map[s.pet_id] = s })
        setPetScans(map)
      } catch {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const statValues = {
    pets: pets.length,
    scans: recentScans.length,
    happy: recentScans.filter(s => s.emotion_label === 'happy' || s.emotion_label === 'relaxed').length,
    alerts: recentScans.filter(s => s.pain_risk !== 'Low').length,
  }

  if (loading) return <div className="page-shell"><LoadingSpinner label="Loading dashboard..." /></div>

  return (
    <div className="page-shell max-w-7xl mx-auto space-y-10 page-enter">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong p-8 rounded-3xl relative overflow-hidden"
      >
        {/* Animated Background gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        
        {/* Animated Border */}
        <div className="absolute inset-0 rounded-3xl border border-white/5 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal/50 to-transparent animate-[scanLine_4s_linear_infinite]" style={{ transformOrigin: 'left' }}></div>
        </div>

        <div className="relative flex flex-wrap items-center justify-between gap-6 z-10">
          <div>
            <p className="section-label mb-3">Dashboard</p>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
              {greeting()}, <span className="gradient-text">{user?.full_name?.split(' ')[0] || 'there'}</span> 👋
            </h1>
            <p className="text-white/60 mt-3 flex items-center gap-2 text-lg">
              <Sparkles size={16} className="text-teal animate-pulse" />
              AI-powered pet wellness at your fingertips
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/scan/live"   className="btn-secondary text-sm py-3 px-6"><Camera size={16} /> Live Scan</Link>
            <Link to="/scan/upload" className="btn-primary  text-sm py-3 px-6"><Upload size={16} /> Upload & Analyze</Link>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ key, label, icon: Icon, color, bg }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="stat-card flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center border shadow-inner`}>
                  <Icon size={20} className={color} />
                </div>
            </div>
            <div>
                <div className="text-4xl font-black text-white"><AnimatedStat end={statValues[key]} /></div>
                <div className="text-white/40 text-xs font-semibold uppercase tracking-widest mt-1">{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/scan/upload', icon: Upload, title: 'Upload Photo', desc: 'Analyze disease & emotions', color: 'from-purple to-purple-600', shadow: 'shadow-purple/20' },
          { to: '/scan/live',   icon: Camera, title: 'Live Camera',  desc: 'Real-time pet scanning',     color: 'from-teal to-teal-600', shadow: 'shadow-teal/20' },
          { to: '/pets/new',    icon: Plus,   title: 'Add Pet',      desc: 'Create a pet profile',       color: 'from-amber to-amber-600', shadow: 'shadow-amber/20' },
        ].map(({ to, icon: Icon, title, desc, color, shadow }) => (
          <Link key={to} to={to} className="glass-strong glass-hover p-6 flex items-center gap-5 group rounded-2xl">
            <div className={`w-14 h-14 rounded-[20px] bg-gradient-to-br ${color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-lg ${shadow}`}>
              <Icon size={22} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-lg">{title}</p>
              <p className="text-white/50 text-sm mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Pets */}
      <section>
        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
          <p className="text-lg font-bold text-white flex items-center gap-2">
              <PawPrint size={18} className="text-teal" /> My Pets
          </p>
          <Link to="/pets/new" className="btn-secondary text-sm py-2 px-4 shrink-0 bg-white/5">
            <Plus size={15} /> Add Pet
          </Link>
        </div>
        {pets.length === 0 ? (
          <div className="glass-strong p-16 rounded-3xl text-center space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-teal/5 to-transparent pointer-events-none"></div>
            <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-teal/20 to-purple/20 border border-white/10 flex items-center justify-center mx-auto text-5xl shadow-inner relative z-10">🐕</div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white">No pets yet</h3>
              <p className="text-white/50 mt-2 max-w-sm mx-auto">Add your first pet to start tracking their health, emotions, and pain indicators.</p>
            </div>
            <Link to="/pets/new" className="btn-primary inline-flex text-base py-3 relative z-10 shadow-lg"><Plus size={18} /> Create Pet Profile</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pets.map((pet, i) => (
              <PetCard key={pet.id} pet={pet} latestScan={petScans[pet.id]} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <section className="pb-10">
          <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
             <Clock size={18} className="text-teal" />
             <p className="text-lg font-bold text-white">Recent Scans</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentScans.slice(0, 4).map((scan) => (
              <Link key={scan.id} to={`/results/${scan.id}`} className="block group">
                <div className="group-hover:-translate-y-1 transition-transform duration-300">
                    <ResultCard scan={scan} compact />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
