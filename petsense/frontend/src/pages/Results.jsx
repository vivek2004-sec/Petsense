import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Share2, Trash2, BarChart2, RefreshCw } from 'lucide-react'
import ResultCard    from '../components/ResultCard'
import HealthReport  from '../components/HealthReport'
import PainAlert     from '../components/PainAlert'
import LoadingSpinner from '../components/LoadingSpinner'
import { scansApi }  from '../api/scans'
import { petsApi }   from '../api/pets'
import toast from 'react-hot-toast'

export default function Results() {
  const { scanId } = useParams()
  const navigate = useNavigate()
  const [scan, setScan]   = useState(null)
  const [pet, setPet]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const s = await scansApi.get(scanId)
        setScan(s)
        if (s.pet_id) {
          const p = await petsApi.get(s.pet_id)
          setPet(p)
        }
      } catch {
        toast.error('Scan not found')
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [scanId, navigate])

  const handleDelete = async () => {
    if (!confirm('Delete this scan? This cannot be undone.')) return
    await scansApi.delete(scanId)
    toast.success('Scan deleted')
    navigate('/dashboard')
  }

  if (loading) return <div className="pt-16"><LoadingSpinner label="Loading results..." /></div>
  if (!scan) return null

  return (
    <div className="page-shell max-w-2xl mx-auto page-enter space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex gap-2">
          {pet && (
            <Link to={`/pets/${pet.id}/history`} className="btn-secondary text-sm py-2 px-3">
              <BarChart2 size={14} /> History
            </Link>
          )}
          <Link
            to={pet ? `/scan/upload?pet=${pet.id}&species=${pet.species}` : '/scan/upload'}
            className="btn-secondary text-sm py-2 px-3"
          >
            <RefreshCw size={14} /> Re-scan
          </Link>
          <button onClick={handleDelete} className="p-2 rounded-xl text-white/30 hover:text-rose hover:bg-rose/10 transition-all">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Pet context */}
      {pet && (
        <div className="flex items-center gap-3">
          <span className="text-2xl">{pet.species === 'dog' ? '🐕' : '🐈'}</span>
          <div>
            <h1 className="text-2xl font-black">{pet.name}'s Scan</h1>
            <p className="text-white/40 text-sm capitalize">{pet.breed || pet.species}</p>
          </div>
        </div>
      )}

      {/* Pain alert (high priority — shown before results card) */}
      <PainAlert painRisk={scan.pain_risk} petName={pet?.name} />

      {/* Main result card */}
      <ResultCard scan={scan} />

      {/* Disease analysis — causes, cures, precautions */}
      <HealthReport report={scan.raw_result?.health_report || scan.raw_result?.vision?.health_report} />

      {/* Image preview */}
      {scan.image_path && (
        <div className="glass-strong p-4 rounded-2xl overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Analyzed Image</p>
          <div className="relative rounded-xl overflow-hidden">
            <img
              src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/uploads/${scan.image_path}`}
              alt="Analyzed pet"
              className="w-full object-cover max-h-72"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent pointer-events-none" />
            {scan.pain_risk === 'High' && (
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-rose/90 text-white text-xs font-bold">
                Health Alert
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to={pet ? `/pets/${pet.id}/history` : '/dashboard'} className="btn-secondary flex-1 justify-center">
          <BarChart2 size={15} />
          View History
        </Link>
        <Link to="/scan/upload" className="btn-primary flex-1 justify-center">
          <RefreshCw size={15} />
          New Scan
        </Link>
      </div>
    </div>
  )
}
