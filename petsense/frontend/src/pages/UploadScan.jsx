import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, Zap, ArrowLeft, X, FileAudio, FileImage, ImageIcon } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import { petsApi }    from '../api/pets'
import { analyzeApi } from '../api/analyze'
import toast from 'react-hot-toast'

function FileDropzone({ accept, onFile, file, label, sublabel, icon: Icon, id, preview }) {
  const onDrop = useCallback((accepted) => { if (accepted[0]) onFile(accepted[0]) }, [onFile])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept, maxFiles: 1, maxSize: 20 * 1024 * 1024,
    onDropRejected: () => toast.error('File rejected — check type/size (max 20MB)'),
  })

  return (
    <div
      {...getRootProps()}
      id={id}
      className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300
        ${isDragActive ? 'dropzone-active scale-[1.01]' : 'border-white/12 hover:border-teal/35 hover:bg-white/3'}
        ${file ? 'border-teal/40 bg-teal/5' : ''}`}
    >
      <input {...getInputProps()} />
      {file && preview ? (
        <div className="space-y-4">
          <img src={preview} alt="Preview" className="w-full max-h-52 object-contain rounded-xl mx-auto border border-white/10" />
          <div>
            <p className="text-teal font-semibold text-sm truncate px-4">{file.name}</p>
            <p className="text-white/40 text-xs mt-1">{(file.size / 1024).toFixed(0)} KB · Ready to analyze</p>
          </div>
        </div>
      ) : file ? (
        <div className="space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-teal/15 flex items-center justify-center mx-auto">
            <Icon size={24} className="text-teal" />
          </div>
          <p className="text-teal font-semibold text-sm truncate px-4">{file.name}</p>
          <p className="text-white/40 text-xs">{(file.size / 1024).toFixed(0)} KB</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/8 to-white/3 border border-white/10 flex items-center justify-center mx-auto">
            <Icon size={26} className="text-teal/70" />
          </div>
          <div>
            <p className="font-semibold text-white/80">{label}</p>
            <p className="text-white/35 text-sm mt-1.5">{sublabel || 'Drag & drop or click to browse'}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function UploadScan() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [pets, setPets]     = useState([])
  const [petId, setPetId]   = useState(searchParams.get('pet') || '')
  const [species, setSpecies] = useState(searchParams.get('species') || 'dog')
  const [mode, setMode]     = useState('image')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [loading, setLoading]     = useState(false)

  useEffect(() => { petsApi.list().then(setPets).catch(() => {}) }, [])

  const handleImageFile = (file) => {
    setImageFile(file)
    if (file.type.startsWith('image/')) {
      setImagePreview(URL.createObjectURL(file))
    } else {
      setImagePreview(null)
    }
  }

  const clearImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
  }

  const canAnalyze = mode === 'image' ? !!imageFile : mode === 'audio' ? !!audioFile : (!!imageFile && !!audioFile)

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      let result
      if (mode === 'combined' && imageFile && audioFile) {
        result = await analyzeApi.combined(imageFile, audioFile, petId || null, species)
      } else if (mode === 'audio' && audioFile) {
        result = await analyzeApi.audio(audioFile, petId || null, species)
      } else if (imageFile) {
        result = await analyzeApi.image(imageFile, petId || null, species)
      }
      if (result) {
        toast.success('Analysis complete! 🐾')
        navigate(`/results/${result.id}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingSpinner label="AI is analyzing your pet..." fullScreen />

  return (
    <div className="page-shell max-w-3xl mx-auto space-y-7 page-enter">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/45 hover:text-white transition-colors text-sm group">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back
      </button>

      <PageHeader
        icon={Upload}
        iconClass="from-purple to-purple-600"
        title="Upload & Analyze"
        subtitle="Upload a photo or video — our AI detects diseases, emotions, and gives care advice"
      />

      {/* Mode selector pills */}
      <div>
        <p className="form-label mb-2">Analysis Mode</p>
        <div className="pill-group">
          {[
            { id: 'image', label: '📸 Image / Video' },
            { id: 'audio', label: '🎙 Audio only' },
            { id: 'combined', label: '📸🎙 Combined' },
          ].map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`pill ${mode === m.id ? 'pill-active' : ''}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="glass p-5 sm:p-6 space-y-4">
        <p className="section-label">Scan Settings</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Pet (optional)</label>
            <select id="upload-pet-select" value={petId} onChange={e => setPetId(e.target.value)} className="input-field">
              <option value="">No pet selected</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Species</label>
            <div className="pill-group !p-1">
              {['dog', 'cat'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpecies(s)}
                  className={`pill ${species === s ? 'pill-active' : ''}`}
                >
                  {s === 'dog' ? '🐕 Dog' : '🐈 Cat'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Drop zones */}
      <div className="space-y-4">
        {mode !== 'audio' && (
          <div className="relative">
            <FileDropzone
              id="image-dropzone"
              accept={{ 'image/*': [], 'video/*': [] }}
              onFile={handleImageFile}
              file={imageFile}
              preview={imagePreview}
              label="Drop your pet's photo or video"
              sublabel="JPG, PNG, WebP or MP4 · Max 20MB"
              icon={FileImage}
            />
            {imageFile && (
              <button onClick={clearImage}
                className="absolute top-3 right-3 p-2 rounded-xl bg-navy/80 border border-white/10 hover:bg-rose/20 text-white/50 hover:text-rose transition-all">
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {mode !== 'image' && (
          <div className="relative">
            <FileDropzone
              id="audio-dropzone"
              accept={{ 'audio/*': [] }}
              onFile={setAudioFile}
              file={audioFile}
              label="Drop bark, meow, or whine recording"
              sublabel="MP3, WAV, OGG · Max 20MB"
              icon={FileAudio}
            />
            {audioFile && (
              <button onClick={() => setAudioFile(null)}
                className="absolute top-3 right-3 p-2 rounded-xl bg-navy/80 border border-white/10 hover:bg-rose/20 text-white/50 hover:text-rose transition-all">
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="glass p-4 flex gap-3 items-start">
        <ImageIcon size={16} className="text-teal shrink-0 mt-0.5" />
        <p className="text-white/50 text-sm leading-relaxed">
          <strong className="text-white/70">Tip:</strong> For best disease detection, use a clear photo with the pet centered, good lighting, and visible skin/coat area.
        </p>
      </div>

      <motion.button
        id="upload-analyze-btn"
        onClick={handleAnalyze}
        disabled={!canAnalyze}
        className="btn-primary w-full justify-center py-4 text-base rounded-2xl"
        whileHover={canAnalyze ? { scale: 1.01 } : {}}
        whileTap={canAnalyze ? { scale: 0.99 } : {}}
      >
        <Zap size={18} />
        Analyze Now
      </motion.button>
    </div>
  )
}
