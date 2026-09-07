import { motion } from 'framer-motion'
import { AlertTriangle, Bug, FlaskConical, Shield, Stethoscope, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const LIKELIHOOD_COLORS = {
  Likely:       'bg-rose/15 text-rose border-rose/30',
  Possible:     'bg-amber/15 text-amber border-amber/30',
  'Less likely':'bg-white/5 text-white/50 border-white/10',
}

function DiseaseCard({ disease, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const badgeClass = LIKELIHOOD_COLORS[disease.likelihood] || LIKELIHOOD_COLORS.Possible

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Bug size={16} className="text-teal shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{disease.name}</p>
            <p className="text-white/40 text-xs mt-0.5">{Math.round(disease.confidence * 100)}% match</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
            {disease.likelihood}
          </span>
          {open ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
        </div>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-4 pb-4 space-y-4 border-t border-white/8"
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
    </div>
  )
}

function Section({ icon: Icon, title, color, children }) {
  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-wider ${color} flex items-center gap-1 mb-2`}>
        <Icon size={10} /> {title}
      </p>
      <ul className="space-y-1.5">
        {children.map((item, i) => (
          <li key={i} className="text-white/65 text-sm leading-relaxed flex gap-2">
            <span className="text-white/25 shrink-0">•</span>
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
      className={`rounded-2xl p-5 sm:p-6 space-y-4 ${hasConcern ? 'bg-rose/5 border border-rose/25 ring-1 ring-rose/10' : 'glass-strong'}`}
    >
      <div className="flex items-center gap-2">
        <Stethoscope size={16} className={hasConcern ? 'text-rose' : 'text-teal'} />
        <h3 className="font-bold text-white">Health & Disease Analysis</h3>
      </div>

      {report.overall_assessment && (
        <p className="text-white/75 text-sm leading-relaxed">{report.overall_assessment}</p>
      )}

      {report.urgent_action && hasConcern && (
        <div className="rounded-xl p-3 bg-rose/10 border border-rose/25 flex gap-2">
          <AlertTriangle size={14} className="text-rose shrink-0 mt-0.5" />
          <p className="text-white/80 text-sm leading-relaxed">{report.urgent_action}</p>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
          Possible Conditions
        </p>
        {report.possible_diseases.map((d, i) => (
          <DiseaseCard key={d.name} disease={d} defaultOpen={i === 0} />
        ))}
      </div>

      {report.general_precautions?.length > 0 && (
        <div className="rounded-xl p-4 bg-white/3 border border-white/8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-1">
            <Shield size={10} /> General Precautions
          </p>
          <ul className="space-y-1.5">
            {report.general_precautions.map((p, i) => (
              <li key={i} className="text-white/50 text-xs leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
