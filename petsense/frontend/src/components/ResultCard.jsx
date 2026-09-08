import { motion, AnimatePresence } from 'framer-motion'
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
  High:   { color: 'badge-high badge-pulse',   icon: AlertTriangle, label: 'High Pain Risk',   glow: 'shadow-rose-500/30' },
}

// Circular Confidence Gauge
function ConfidenceGauge({ confidence }) {
  const percent = Math.round(confidence * 100);
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="transform -rotate-90 w-16 h-16">
        <circle
          className="text-white/10"
          strokeWidth="4"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="32"
          cy="32"
        />
        <motion.circle
          className="text-accent"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="32"
          cy="32"
        />
      </svg>
      <span className="absolute text-sm font-bold text-accent">{percent}%</span>
    </div>
  );
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
      transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
      className={`glass-strong glass-hover p-6 space-y-5 ${isHighPain ? 'border-rose/30 ring-1 ring-rose/20 glow-breathing' : ''}`}
      id={`result-card-${scan.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-4xl shadow-glow relative overflow-hidden">
             {/* Animated gradient behind emoji */}
             <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent opacity-50"></div>
             <span className="relative z-10">{emoji}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold capitalize text-fg flex items-center gap-2">
              {scan.emotion_label || '—'}
            </h2>
            <p className="text-white/40 text-xs mt-1">
              {scan.scan_type && <span className="capitalize">{scan.scan_type} analysis</span>}
              {scan.created_at && <span> · {format(new Date(scan.created_at), 'MMM d, yyyy HH:mm')}</span>}
            </p>
            {scan.audio_label && (
              <p className="text-sm text-purple/80 mt-1 flex items-center gap-1 font-medium bg-purple/10 px-2 py-0.5 rounded-md w-fit">
                <Volume2 size={12} />
                Audio: <span className="capitalize">{scan.audio_label}</span>
              </p>
            )}
          </div>
        </div>

        {/* Pain risk badge */}
        <div className={`badge ${painConfig.color} shrink-0`}>
          <PainIcon size={12} />
          {painConfig.label}
        </div>
      </div>

      {/* Circular Confidence Gauge replaced linear bar */}
      {scan.confidence != null && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
          <ConfidenceGauge confidence={scan.confidence} />
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1 mb-1">
              <Zap size={10} className="text-accent" />
              AI Confidence
            </span>
            {scan.confidence < 0.65 ? (
              <p className="text-amber text-xs flex items-center gap-1">
                <AlertTriangle size={10} />
                Lower confidence — use a closer, well-lit photo
              </p>
            ) : (
              <p className="text-teal/70 text-xs flex items-center gap-1">
                <Sparkles size={10} />
                High confidence reading
              </p>
            )}
            {isCvAnalysis && (
              <p className="text-white/40 text-[11px] mt-1">
                Vision analysis reads coat, skin, and body signals
              </p>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {!compact && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-5"
          >
            {/* Care advice */}
            {careAdvice.length > 0 && (
              <div className="rounded-xl p-4 bg-gradient-to-br from-teal/10 to-transparent border border-teal/20 space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal flex items-center gap-1">
                  <Heart size={10} /> Care Advice
                </p>
                <ul className="space-y-2">
                  {careAdvice.map((tip, i) => (
                    <li key={i} className="text-white/80 text-sm leading-relaxed flex gap-2">
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
                  {scan.cues_detected.map((cue, i) => {
                    // Color code cues based on keywords
                    let cueColor = "bg-white/5 border-white/10 text-white/70";
                    if (cue.includes("pain") || cue.includes("lesion") || cue.includes("redness") || cue.includes("significant") || cue.includes("urgent")) {
                        cueColor = "bg-rose/10 border-rose/20 text-rose";
                    } else if (cue.includes("mild") || cue.includes("possible") || cue.includes("underweight") || cue.includes("stress")) {
                        cueColor = "bg-amber/10 border-amber/20 text-amber";
                    } else if (cue.includes("healthy") || cue.includes("normal") || cue.includes("relaxed")) {
                        cueColor = "bg-teal/10 border-teal/20 text-teal";
                    }

                    return (
                      <span
                        key={i}
                        className={`px-3 py-1 rounded-full text-[11px] font-medium border ${cueColor}`}
                      >
                        {cue}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* High pain alert */}
            {isHighPain && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl p-4 bg-gradient-to-r from-rose/10 to-rose/5 border border-rose/30 space-y-2 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-rose"></div>
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
              <div className="rounded-xl p-4 bg-amber/10 border border-amber/30 flex items-start gap-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber"></div>
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
