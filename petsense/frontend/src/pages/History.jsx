import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Camera, Calendar } from 'lucide-react'
import TrendChart    from '../components/TrendChart'
import ResultCard    from '../components/ResultCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { petsApi }   from '../api/pets'
import { scansApi }  from '../api/scans'
import { format }    from 'date-fns'
import toast from 'react-hot-toast'

export default function History() {
  const { petId } = useParams()
  const [pet, setPet]     = useState(null)
  const [history, setHistory] = useState([])
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [petData, historyData, scansData] = await Promise.all([
          petsApi.get(petId),
          petsApi.history(petId, 100),
          scansApi.list(petId, 50),
        ])
        setPet(petData)
        setHistory(historyData)
        setScans(scansData)
      } catch {
        toast.error('Failed to load history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [petId])

  if (loading) return <div className="pt-16"><LoadingSpinner label="Loading history..." /></div>
  if (!pet) return null

  const emoji = pet.species === 'dog' ? '🐕' : '🐈'

  // Aggregate stats
  const totalScans = scans.length
  const happyCount = scans.filter(s => s.emotion_label === 'happy' || s.emotion_label === 'relaxed').length
  const painAlerts = scans.filter(s => s.pain_risk !== 'Low').length
  const avgConf    = scans.length ? (scans.reduce((a, s) => a + (s.confidence || 0), 0) / scans.length * 100).toFixed(0) : '—'

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 sm:px-6 max-w-4xl mx-auto page-enter space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link to="/dashboard" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm mb-3">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{emoji}</span>
            <div>
              <h1 className="text-3xl font-black">{pet.name}</h1>
              <p className="text-white/40 text-sm capitalize">{pet.breed || pet.species} · Mood & Pain History</p>
            </div>
          </div>
        </div>
        <Link to={`/scan/upload?pet=${pet.id}&species=${pet.species}`} className="btn-primary text-sm py-2 px-4">
          <Camera size={15} /> New Scan
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Scans',   value: totalScans, icon: '📊' },
          { label: 'Happy / Calm',  value: happyCount, icon: '😊' },
          { label: 'Pain Alerts',   value: painAlerts, icon: '⚠️', warn: painAlerts > 0 },
          { label: 'Avg Confidence', value: `${avgConf}%`, icon: '🎯' },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass p-4 text-center space-y-1 ${s.warn ? 'border border-amber/30' : ''}`}
          >
            <div className="text-2xl">{s.icon}</div>
            <div className={`text-2xl font-black ${s.warn ? 'gradient-text-warm' : 'gradient-text'}`}>{s.value}</div>
            <div className="text-white/40 text-xs uppercase tracking-wider">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Trend charts */}
      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          📈 Trend Analysis
        </h2>
        <TrendChart history={history} />
      </section>

      {/* Scan timeline */}
      {scans.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-teal" /> Scan Timeline
          </h2>
          <div className="space-y-4">
            {scans.map((scan) => (
              <Link key={scan.id} to={`/results/${scan.id}`} className="block hover:scale-[1.005] transition-transform">
                <ResultCard scan={scan} compact />
              </Link>
            ))}
          </div>
        </section>
      )}

      {scans.length === 0 && (
        <div className="glass p-12 text-center space-y-4">
          <div className="text-5xl">📊</div>
          <h3 className="text-xl font-bold">No scans yet</h3>
          <p className="text-white/50 text-sm">Run your first scan to start tracking {pet.name}'s wellbeing</p>
          <Link to={`/scan/upload?pet=${pet.id}&species=${pet.species}`} className="btn-primary inline-flex">
            <Camera size={16} /> Scan {pet.name}
          </Link>
        </div>
      )}
    </div>
  )
}
