import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Mic, Zap, ArrowLeft, Info } from 'lucide-react'
import CameraCapture from '../components/CameraCapture'
import LoadingSpinner from '../components/LoadingSpinner'
import { petsApi }    from '../api/pets'
import { analyzeApi } from '../api/analyze'
import toast from 'react-hot-toast'

export default function LiveScan() {
  const navigate = useNavigate()
  const [searchParams]  = useSearchParams()
  const [pets, setPets] = useState([])
  const [petId, setPetId]   = useState(searchParams.get('pet') || '')
  const [species, setSpecies] = useState('dog')
  const [mode, setMode]       = useState('image')  // 'image' | 'combined'
  const [imageFile, setImageFile] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [loading, setLoading]     = useState(false)

  useEffect(() => {
    petsApi.list().then(setPets).catch(() => {})
  }, [])

  useEffect(() => {
    const pet = pets.find(p => String(p.id) === String(petId))
    if (pet) setSpecies(pet.species)
  }, [petId, pets])

  const canSubmit = imageFile && (mode === 'image' || audioFile)

  const handleAnalyze = async () => {
    if (!imageFile) { toast.error('Please capture a photo first'); return }
    setLoading(true)
    try {
      let result
      if (mode === 'combined' && audioFile) {
        result = await analyzeApi.combined(imageFile, audioFile, petId || null, species)
      } else {
        result = await analyzeApi.image(imageFile, petId || null, species)
      }
      toast.success('Analysis complete! 🐾')
      navigate(`/results/${result.id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner label="AI is analysing your pet..." fullScreen />

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 sm:px-6 max-w-3xl mx-auto page-enter space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal to-teal-600 flex items-center justify-center shadow-glow">
            <Camera size={18} className="text-navy" />
          </span>
          Live Scan
        </h1>
        <p className="text-white/50 mt-1 ml-14">Use your camera to capture your pet and analyze in real-time</p>
      </div>

      {/* ── Settings ─────────────────────────────────────────────────────── */}
      <div className="glass p-5 space-y-4">
        <h2 className="font-semibold text-sm text-white/60 uppercase tracking-wider">Scan Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Pet selector */}
          <div>
            <label className="form-label">Pet (optional)</label>
            <select
              id="scan-pet-select"
              value={petId}
              onChange={e => setPetId(e.target.value)}
              className="input-field"
            >
              <option value="">No pet selected</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Species */}
          <div>
            <label className="form-label">Species</label>
            <select id="scan-species-select" value={species} onChange={e => setSpecies(e.target.value)} className="input-field">
              <option value="dog">🐕 Dog</option>
              <option value="cat">🐈 Cat</option>
            </select>
          </div>

          {/* Mode */}
          <div>
            <label className="form-label">Scan Mode</label>
            <select id="scan-mode-select" value={mode} onChange={e => setMode(e.target.value)} className="input-field">
              <option value="image">📸 Image only</option>
              <option value="combined">📸🎙 Image + Audio</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Camera ───────────────────────────────────────────────────────── */}
      <div className="glass p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-teal" />
          <h2 className="font-semibold">Camera Capture</h2>
          {mode === 'combined' && (
            <span className="badge badge-low ml-2"><Mic size={10} /> Audio enabled</span>
          )}
        </div>
        <CameraCapture
          onImageCapture={setImageFile}
          onAudioCapture={setAudioFile}
          showAudio={mode === 'combined'}
        />
        {imageFile && (
          <p className="text-teal text-sm flex items-center gap-1.5">
            ✓ Photo captured
          </p>
        )}
        {mode === 'combined' && audioFile && (
          <p className="text-purple text-sm flex items-center gap-1.5">
            ✓ Audio recorded
          </p>
        )}
      </div>

      {/* ── Info ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 text-white/40 text-sm glass p-4">
        <Info size={15} className="shrink-0 mt-0.5" />
        <p>For best results: ensure good lighting, position your pet facing the camera, and capture a clear view of their face and front body.</p>
      </div>

      {/* ── Analyze button ───────────────────────────────────────────────── */}
      <motion.button
        id="analyze-btn"
        onClick={handleAnalyze}
        disabled={!canSubmit}
        className="btn-primary w-full justify-center py-4 text-base"
        whileHover={canSubmit ? { scale: 1.01 } : {}}
        whileTap={canSubmit ? { scale: 0.99 } : {}}
      >
        <Zap size={18} />
        {mode === 'combined' ? 'Analyze Image + Audio' : 'Analyze Photo'}
      </motion.button>
    </div>
  )
}
