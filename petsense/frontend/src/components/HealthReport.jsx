import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Bug, FlaskConical, Shield, Stethoscope, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const LIKELIHOOD_COLORS = {
  Likely:       'bg-rose/15 text-rose border-rose/30',
  Possible:     'bg-amber/15 text-amber border-amber/30',
  'Less likely':'bg-white/5 text-white/50 border-white/10',
}

const HEADER_STRIP = {
  Likely:       'bg-rose',
  Possible:     'bg-amber',
  'Less likely':'bg-white/20',
}

function DiseaseCard({ disease, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const badgeClass = LIKELIHOOD_COLORS[disease.likelihood] || LIKELIHOOD_COLORS.Possible
  const stripClass = HEADER_STRIP[disease.likelihood] || HEADER_STRIP.Possible

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden relative transition-all duration-300 hover:bg-white/10">
      <div className={`absolute top-0 left-0 w-1 h-full ${stripClass}`}></div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 pl-5 text-left transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Bug size={14} className="text-white/80" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{disease.name}</p>
            {/* Confidence Bar */}
            <div className="flex items-center gap-2 mt-1.5">
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${disease.confidence * 100}%` }}
                      className={`h-full rounded-full ${stripClass}`}
                    ></motion.div>
                </div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">{Math.round(disease.confidence * 100)}% match</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
            {disease.likelihood}
          </span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
            <ChevronDown size={16} className="text-white/40" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
            className="px-4 pb-4 pl-5 space-y-4 border-t border-white/8 overflow-hidden"
          >
            <p className="text-white/70 text-sm leading-relaxed pt-3">{disease.summary}</p>

            {disease.causes?.length > 0 && (
              <Section icon={AlertTriangle} title="Possible Causes" color="text-amber">
                {disease.causes}
              </Section>
            )}

            {disease.cures?.length > 0 && (
              <Section icon={FlaskConical} title="Recommended Treatment" color="text-teal">
                {disease.cures}
              </Section>
            )}

            {disease.precautions?.length > 0 && (
              <Section icon={Shield} title="Precautions" color="text-purple">
                {disease.precautions}
              </Section>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Section({ icon: Icon, title, color, children }) {
  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-wider ${color} flex items-center gap-1 mb-2`}>
        <Icon size={10} /> {title}
      </p>
      <ul className="space-y-1.5 bg-black/20 p-3 rounded-xl border border-white/5">
        {children.map((item, i) => (
          <li key={i} className="text-white/70 text-sm leading-relaxed flex gap-2">
            <span className={`${color} shrink-0 opacity-60`}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function HealthReport({ report }) {
  if (!report || !report.possible_diseases?.length) return null

  const hasConcern = report.possible_diseases.some(
    d => d.name !== 'No Significant Disease Detected' && d.confidence >= 0.40
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`rounded-2xl p-5 sm:p-6 space-y-5 ${hasConcern ? 'bg-rose/5 border border-rose/25 ring-1 ring-rose/10' : 'glass-strong'}`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <div className={`p-2 rounded-lg ${hasConcern ? 'bg-rose/20' : 'bg-teal/20'}`}>
           <Stethoscope size={20} className={hasConcern ? 'text-rose' : 'text-teal'} />
        </div>
        <div>
          <h3 className="font-bold text-white">Health & Disease Analysis</h3>
          <p className="text-white/40 text-xs">Based on visual screening cues</p>
        </div>
      </div>

      {report.overall_assessment && (
        <p className="text-white/80 text-sm leading-relaxed p-3 bg-white/5 rounded-xl border border-white/10">
            {report.overall_assessment}
        </p>
      )}

      {report.urgent_action && hasConcern && (
        <div className="rounded-xl p-3 bg-rose/10 border border-rose/25 flex gap-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose"></div>
          <AlertTriangle size={16} className="text-rose shrink-0 mt-0.5" />
          <p className="text-white/90 text-sm leading-relaxed font-medium">{report.urgent_action}</p>
        </div>
      )}

      <div className="space-y-3 pt-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">
          Possible Conditions
        </p>
        {report.possible_diseases.map((d, i) => (
          <DiseaseCard key={d.name} disease={d} defaultOpen={i === 0} />
        ))}
      </div>

      {report.general_precautions?.length > 0 && (
        <div className="rounded-xl p-4 bg-gradient-to-br from-white/5 to-transparent border border-white/10 space-y-2 mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50 flex items-center gap-1">
            <Shield size={10} /> General Precautions
          </p>
          <ul className="space-y-1.5">
            {report.general_precautions.map((p, i) => (
              <li key={i} className="text-white/60 text-xs leading-relaxed flex gap-2">
                <span className="shrink-0 text-white/30">—</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
