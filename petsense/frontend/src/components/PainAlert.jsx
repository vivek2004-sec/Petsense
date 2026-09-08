import { motion } from 'framer-motion'
import { AlertTriangle, MapPin, Phone } from 'lucide-react'

export default function PainAlert({ painRisk, petName = 'your pet' }) {
  if (!painRisk || painRisk === 'Low') return null

  const isHigh = painRisk === 'High'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
      className={`rounded-2xl p-5 space-y-4 relative overflow-hidden ${
        isHigh
          ? 'bg-rose/10 border border-rose/30 glow-breathing'
          : 'bg-amber/10 border border-amber/30'
      }`}
      id="pain-alert-banner"
    >
      {/* Animated gradient border simulation */}
      {isHigh && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl border-2 border-rose/40 animate-pulse opacity-50"></div>
      )}

      <div className="flex items-center gap-3 relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center relative ${
          isHigh ? 'bg-rose/20' : 'bg-amber/20'
        }`}>
          {isHigh && <div className="absolute inset-0 rounded-xl border border-rose/50 badge-pulse"></div>}
          <AlertTriangle size={24} className={isHigh ? 'text-rose' : 'text-amber'} />
        </div>
        <div>
          <h3 className={`font-bold text-lg ${isHigh ? 'text-rose' : 'text-amber'}`}>
            {isHigh ? '🚨 High Pain Risk Detected' : '⚠️ Medium Pain Risk Detected'}
          </h3>
          <p className="text-white/60 text-sm mt-0.5">
            {isHigh
              ? `${petName} may be in significant discomfort`
              : `${petName} shows some signs of discomfort`}
          </p>
        </div>
      </div>

      <p className="text-white/80 text-sm leading-relaxed relative z-10 bg-black/20 p-3 rounded-lg border border-white/5">
        {isHigh
          ? 'Our AI has detected behavioral indicators consistent with pain or significant distress. Please seek veterinary care promptly. Early intervention can prevent worsening conditions.'
          : 'Some behavioral cues suggest mild discomfort. Monitor closely for the next 24 hours and consult a veterinarian if symptoms persist or worsen.'}
      </p>

      <div className="flex flex-wrap gap-3 relative z-10">
        <a
          href="https://www.google.com/search?q=emergency+vet+near+me"
          target="_blank"
          rel="noopener noreferrer"
          className={`btn-${isHigh ? 'danger' : 'secondary'} text-sm py-2 px-4 shadow-lg`}
          id="find-vet-btn"
        >
          <MapPin size={14} />
          Find a Vet Near Me
        </a>
        {isHigh && (
          <a
            href="tel:+18005485748"
            className="btn-secondary text-sm py-2 px-4 bg-white/5"
            id="emergency-vet-phone-btn"
          >
            <Phone size={14} />
            Emergency Vet Hotline
          </a>
        )}
      </div>

      <p className="text-white/30 text-[11px] uppercase tracking-wider font-semibold border-t border-white/10 pt-3 mt-2 relative z-10">
        ⚕️ This is NOT a medical diagnosis. Only a licensed veterinarian can properly assess your pet's health.
      </p>
    </motion.div>
  )
}
