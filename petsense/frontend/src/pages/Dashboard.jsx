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
  { key: 'pets',    label: 'My Pets',      icon: PawPrint,       color: 'text-teal' },
  { key: 'scans',   label: 'Total Scans',  icon: Camera,         color: 'text-purple' },
  { key: 'happy',   label: 'Happy Moments', icon: Heart,         color: 'text-amber' },
  { key: 'alerts',  label: 'Health Alerts', icon: AlertTriangle, color: 'text-rose' },
]

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
        className="glass-strong p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="section-label mb-3">Dashboard</p>
            <h1 className="text-3xl sm:text-4xl font-black">
              {greeting()}, <span className="text-accent">{user?.full_name?.split(' ')[0] || 'there'}</span> 👋
            </h1>
            <p className="text-muted mt-2 flex items-center gap-2">
              <Sparkles size={14} className="text-accent" />
              AI-powered pet wellness at your fingertips
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/scan/live"   className="btn-secondary text-sm py-2.5 px-5"><Camera size={15} /> Live Scan</Link>
            <Link to="/scan/upload" className="btn-primary  text-sm py-2.5 px-5"><Upload size={15} /> Upload</Link>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ key, label, icon: Icon, color }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="stat-card"
          >
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <div className="text-3xl font-black text-fg">{statValues[key]}</div>
            <div className="text-subtle text-xs font-medium uppercase tracking-wider mt-1">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/scan/upload', icon: Upload, title: 'Upload Photo', desc: 'Analyze disease & emotions', color: 'from-purple to-purple-600' },
          { to: '/scan/live',   icon: Camera, title: 'Live Camera',  desc: 'Real-time pet scanning',     color: 'from-teal to-teal-600' },
          { to: '/pets/new',    icon: Plus,   title: 'Add Pet',      desc: 'Create a pet profile',       color: 'from-amber to-amber-600' },
        ].map(({ to, icon: Icon, title, desc, color }) => (
          <Link key={to} to={to} className="glass glass-hover p-5 flex items-center gap-4 group">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white">{title}</p>
              <p className="text-white/45 text-sm">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Pets */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <p className="section-label flex-1">My Pets</p>
          <Link to="/pets/new" className="btn-secondary text-sm py-2 px-4 shrink-0 ml-4">
            <Plus size={15} /> Add Pet
          </Link>
        </div>
        {pets.length === 0 ? (
          <div className="glass-strong p-14 text-center space-y-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal/20 to-purple/20 flex items-center justify-center mx-auto text-4xl">🐕</div>
            <div>
              <h3 className="text-xl font-bold">No pets yet</h3>
              <p className="text-white/50 text-sm mt-1 max-w-sm mx-auto">Add your first pet to start tracking their health and emotions</p>
            </div>
            <Link to="/pets/new" className="btn-primary inline-flex"><Plus size={16} /> Add Your First Pet</Link>
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
        <section>
          <p className="section-label mb-5"><Clock size={12} className="text-teal" /> Recent Scans</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recentScans.slice(0, 4).map((scan) => (
              <Link key={scan.id} to={`/results/${scan.id}`} className="block hover:scale-[1.01] transition-transform duration-200">
                <ResultCard scan={scan} compact />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
