import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import { Upload, Zap, ArrowLeft, X, FileAudio, FileImage, ImageIcon } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import { petsApi }    from '../api/pets'
import { analyzeApi } from '../api/analyze'
import toast from 'react-hot-toast'

function FileDropzone({ accept, onFile, file, label, sublabel, icon: Icon, id, preview, isAudio = false }) {
  const onDrop = useCallback((accepted) => { if (accepted[0]) onFile(accepted[0]) }, [onFile])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept, maxFiles: 1, maxSize: 20 * 1024 * 1024,
    onDropRejected: () => toast.error('File rejected — check type/size (max 20MB)'),
  })

  return (
    <div
      {...getRootProps()}
      id={id}
      className={`relative rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden group
        ${isDragActive ? 'border-teal bg-teal/5 shadow-[0_0_30px_rgba(0,212,180,0.15)] scale-[1.02]' : 'border-white/10 hover:border-teal/50 hover:bg-white/5 bg-white/[0.02]'}
        ${file ? 'border-teal/40 bg-teal/10 border-solid' : 'border-dashed border-2'}`}
    >
      <input {...getInputProps()} />
      
      {/* Animated dashed border effect on hover if empty */}
      {!file && !isDragActive && (
          <div className="absolute inset-0 border-2 border-dashed border-teal/0 group-hover:border-teal/30 rounded-3xl transition-colors pointer-events-none"></div>
      )}

      {file && preview ? (
        <div className="space-y-5">
          <div className="relative inline-block w-full">
            <img src={preview} alt="Preview" className="w-full max-h-64 object-contain rounded-2xl mx-auto shadow-lg" />
            <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] pointer-events-none"></div>
            {/* Ready badge */}
            <div className="absolute top-3 left-3 bg-navy/90 backdrop-blur text-teal text-xs font-bold px-3 py-1.5 rounded-lg border border-teal/30 shadow-lg flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse"></span>
                Ready to analyze
            </div>
          </div>
          <div>
            <p className="text-white font-bold text-base truncate px-4">{file.name}</p>
            <p className="text-teal/70 text-sm mt-1">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
        </div>
      ) : file ? (
        <div className="space-y-4 py-4">
          <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-teal/20 to-purple/20 flex items-center justify-center mx-auto shadow-inner border border-white/10 relative overflow-hidden">
             {/* Audio waves animation */}
             {isAudio && (
                 <div className="absolute bottom-0 w-full flex items-end justify-center gap-1 h-8 px-4 opacity-50">
                    {[1,2,3,4,5].map(i => (
                        <motion.div key={i} animate={{ height: ['20%', '80%', '20%'] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }} className="w-1.5 bg-purple rounded-t-sm"></motion.div>
                    ))}
                 </div>
             )}
            <Icon size={32} className="text-white relative z-10" />
          </div>
          <div>
              <p className="text-white font-bold text-base truncate px-4">{file.name}</p>
              <p className="text-purple/70 text-sm mt-1">{(file.size / 1024).toFixed(0)} KB · Ready to analyze</p>
          </div>
        </div>
      ) : (
        <div className="space-y-5 py-6">
          <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-inner">
            <Icon size={32} className="text-white/70 group-hover:text-teal transition-colors" />
          </div>
          <div>
            <p className="font-bold text-white text-lg">{label}</p>
            <p className="text-white/40 text-sm mt-2">{sublabel || 'Drag & drop or click to browse'}</p>
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

  const clearImage = (e) => {
    e.stopPropagation();
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
  }

  const clearAudio = (e) => {
    e.stopPropagation();
    setAudioFile(null);
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
    <div className="page-shell max-w-3xl mx-auto space-y-8 page-enter pb-20">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium group bg-white/5 px-4 py-2 rounded-xl w-fit">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
      </button>

      <PageHeader
        icon={Upload}
        iconClass="from-purple to-purple-600"
        title="Upload & Analyze"
        subtitle="Upload a photo or video — our AI detects diseases, emotions, and gives care advice"
      />

      {/* Mode selector pills */}
      <div className="glass-strong p-2 rounded-2xl">
        <div className="flex gap-2 p-1">
          {[
            { id: 'image', label: '📸 Image / Video' },
            { id: 'audio', label: '🎙 Audio only' },
            { id: 'combined', label: '📸🎙 Combined' },
          ].map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${
                  mode === m.id 
                  ? 'bg-gradient-to-r from-teal to-teal-600 text-navy shadow-[0_4px_15px_rgba(0,212,180,0.3)]' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="glass-strong p-6 sm:p-8 space-y-5 rounded-3xl">
        <p className="text-sm font-bold text-white/50 uppercase tracking-widest border-b border-white/5 pb-3">Scan Settings</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div>
            <label className="form-label mb-2 block">Pet Profile (optional)</label>
            <select id="upload-pet-select" value={petId} onChange={e => setPetId(e.target.value)} className="input-field !bg-black/20 !border-white/10 hover:!border-teal/30 focus:!border-teal transition-colors">
              <option value="">Guest scan (No profile)</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label mb-2 block">Species</label>
            <div className="flex gap-2">
              {['dog', 'cat'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpecies(s)}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all border ${
                      species === s 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-black/20 border-white/5 text-white/40 hover:bg-white/5'
                  }`}
                >
                  {s === 'dog' ? '🐕 Dog' : '🐈 Cat'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Drop zones */}
      <div className="space-y-6">
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
                className="absolute top-4 right-4 p-2.5 rounded-xl bg-navy border border-white/20 hover:bg-rose hover:border-rose text-white transition-all shadow-xl z-20">
                <X size={16} />
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
              isAudio={true}
            />
            {audioFile && (
              <button onClick={clearAudio}
                className="absolute top-4 right-4 p-2.5 rounded-xl bg-navy border border-white/20 hover:bg-rose hover:border-rose text-white transition-all shadow-xl z-20">
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="glass p-5 rounded-2xl flex gap-4 items-start border-l-4 border-l-teal bg-gradient-to-r from-teal/5 to-transparent">
        <div className="p-2 bg-teal/10 rounded-xl shrink-0">
           <ImageIcon size={18} className="text-teal" />
        </div>
        <p className="text-white/70 text-sm leading-relaxed pt-1">
          <strong className="text-white font-semibold">Pro Tip:</strong> For the most accurate disease detection, use a clear, well-lit photo with the pet centered. Ensure areas of concern (like skin issues) are clearly visible.
        </p>
      </div>

      <motion.button
        id="upload-analyze-btn"
        onClick={handleAnalyze}
        disabled={!canAnalyze}
        className="btn-primary w-full justify-center py-5 text-lg rounded-2xl shadow-[0_8px_30px_rgba(0,212,180,0.2)] mt-8"
        whileHover={canAnalyze ? { scale: 1.02 } : {}}
        whileTap={canAnalyze ? { scale: 0.98 } : {}}
      >
        <Zap size={20} className={canAnalyze ? "animate-pulse" : ""} />
        Analyze Now
      </motion.button>
    </div>
  )
}
