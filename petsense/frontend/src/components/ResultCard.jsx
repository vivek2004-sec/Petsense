import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Zap, Volume2, Eye, ChevronRight, Stethoscope, MapPin, Heart, Sparkles } from 'lucide-react'
import { format } from 'date-fns'

const EMOTION_ICONS = {
  happy:      '😄',
  relaxed:    '😌',
  anxious:    '😰',
  scared:     '😨',
  alert:      '👀',
  aggressive: '😤',
  neutral:    '😐',
}

const PAIN_CONFIG = {
  Low:    { color: 'badge-low',    icon: CheckCircle,  label: 'Low Pain Risk',    glow: 'shadow-none' },
  Medium: { color: 'badge-medium', icon: AlertTriangle, label: 'Medium Pain Risk', glow: 'shadow-amber-500/20' },
  High:   { color: 'badge-high',   icon: AlertTriangle, label: 'High Pain Risk',   glow: 'shadow-rose-500/30' },
}

export default function ResultCard({ scan, compact = false }) {
  if (!scan) return null

  const painConfig = PAIN_CONFIG[scan.pain_risk] || PAIN_CONFIG.Low
  const PainIcon = painConfig.icon
  const emoji = EMOTION_ICONS[scan.emotion_label] || '🐾'
  const isHighPain = scan.pain_risk === 'High'
  const isMediumPain = scan.pain_risk === 'Medium'
  const careAdvice = scan.raw_result?.care_advice || scan.raw_result?.vision?.advice || []
  const analysisMode = scan.raw_result?.vision?.analysis_mode
  const isCvAnalysis = analysisMode === 'cv_heuristic'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`glass-strong p-6 space-y-5 ${isHighPain ? 'border-rose/30 ring-1 ring-rose/20' : ''}`}
      id={`result-card-${scan.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{emoji}</span>
            <div>
              <h2 className="text-2xl font-bold capitalize text-fg">{scan.emotion_label || '—'}</h2>
              {scan.audio_label && (
                <p className="text-sm text-white/50 mt-0.5 flex items-center gap-1">
                  <Volume2 size={12} />
                  Audio: <span className="text-purple capitalize">{scan.audio_label}</span>
                </p>
              )}
            </div>
          </div>
          <p className="text-white/40 text-xs mt-2">
            {scan.scan_type && <span className="capitalize">{scan.scan_type} analysis</span>}
            {scan.created_at && <span> · {format(new Date(scan.created_at), 'MMM d, yyyy HH:mm')}</span>}
          </p>
        </div>

        {/* Pain risk badge */}
        <div className={`badge ${painConfig.color} shrink-0`}>
          <PainIcon size={12} />
          {painConfig.label}
        </div>
      </div>

      {/* Confidence bar */}
      {scan.confidence != null && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1">
              <Zap size={10} />
              Confidence
            </span>
            <span className="text-sm font-bold text-accent">{Math.round(scan.confidence * 100)}%</span>
          </div>
          <div className="confidence-bar-track">
            <motion.div
              className="confidence-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${scan.confidence * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
          {scan.confidence < 0.65 && (
            <p className="text-amber text-xs mt-1.5 flex items-center gap-1">
              <AlertTriangle size={10} />
              Lower confidence — use a closer, well-lit photo for best results
            </p>
          )}
          {isCvAnalysis && (
            <p className="text-teal/70 text-xs mt-1.5 flex items-center gap-1">
              <Sparkles size={10} />
              AI vision analysis — reads coat, skin, and body signals from your photo
            </p>
          )}
        </div>
      )}

      {!compact && (
        <>
          {/* Care advice */}
          {careAdvice.length > 0 && (
            <div className="rounded-xl p-4 bg-teal/5 border border-teal/20 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal flex items-center gap-1">
                <Heart size={10} /> Care Advice
              </p>
              <ul className="space-y-2">
                {careAdvice.map((tip, i) => (
                  <li key={i} className="text-white/75 text-sm leading-relaxed flex gap-2">
                    <span className="text-teal shrink-0 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Explanation */}
          {scan.explanation && (
            <div className="glass p-4 rounded-xl space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-1">
                <Eye size={10} /> Analysis
              </p>
              <p className="text-white/80 text-sm leading-relaxed">{scan.explanation}</p>
            </div>
          )}

          {/* Detected cues */}
          {scan.cues_detected?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2 flex items-center gap-1">
                <ChevronRight size={10} /> Detected Cues
              </p>
              <div className="flex flex-wrap gap-2">
                {scan.cues_detected.map((cue, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-white/70"
                  >
                    {cue}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* High pain alert */}
          {isHighPain && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl p-4 bg-rose/10 border border-rose/30 space-y-2"
            >
              <div className="flex items-center gap-2 text-rose font-bold">
                <AlertTriangle size={16} />
                Possible Pain Detected — Please Act
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Our AI has detected indicators that may suggest your pet is in discomfort or pain.
                <strong className="text-rose"> Please consult a licensed veterinarian as soon as possible.</strong>
              </p>
              <a
                href="https://www.google.com/search?q=vets+near+me"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-danger text-sm py-2 px-4 inline-flex"
              >
                <MapPin size={14} />
                Find a Vet Near Me
              </a>
            </motion.div>
          )}

          {isMediumPain && !isHighPain && (
            <div className="rounded-xl p-4 bg-amber/10 border border-amber/30 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber shrink-0 mt-0.5" />
              <p className="text-white/70 text-sm leading-relaxed">
                Some behavioral cues suggest mild discomfort. Monitor your pet closely and
                <strong className="text-amber"> consult a vet</strong> if symptoms persist.
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="rounded-xl p-3 bg-white/3 border border-white/8">
            <div className="flex items-start gap-2">
              <Stethoscope size={14} className="text-white/30 shrink-0 mt-0.5" />
              <p className="text-white/35 text-xs leading-relaxed">{scan.disclaimer}</p>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
