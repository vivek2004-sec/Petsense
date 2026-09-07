import { motion } from 'framer-motion'
import { AlertTriangle, MapPin, Phone } from 'lucide-react'

export default function PainAlert({ painRisk, petName = 'your pet' }) {
  if (!painRisk || painRisk === 'Low') return null

  const isHigh = painRisk === 'High'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl p-5 space-y-4 ${
        isHigh
          ? 'bg-rose/10 border-2 border-rose/40 shadow-pain-glow'
          : 'bg-amber/10 border border-amber/30'
      }`}
      id="pain-alert-banner"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isHigh ? 'bg-rose/20' : 'bg-amber/20'
        }`}>
          <AlertTriangle size={20} className={isHigh ? 'text-rose' : 'text-amber'} />
        </div>
        <div>
          <h3 className={`font-bold text-lg ${isHigh ? 'text-rose' : 'text-amber'}`}>
            {isHigh ? '🚨 High Pain Risk Detected' : '⚠️ Medium Pain Risk Detected'}
          </h3>
          <p className="text-white/50 text-sm">
            {isHigh
              ? `${petName} may be in significant discomfort`
              : `${petName} shows some signs of discomfort`}
          </p>
        </div>
      </div>

      <p className="text-white/70 text-sm leading-relaxed">
        {isHigh
          ? 'Our AI has detected behavioral indicators consistent with pain or significant distress. Please seek veterinary care promptly. Early intervention can prevent worsening conditions.'
          : 'Some behavioral cues suggest mild discomfort. Monitor closely for the next 24 hours and consult a veterinarian if symptoms persist or worsen.'}
      </p>

      <div className="flex flex-wrap gap-3">
        <a
          href="https://www.google.com/search?q=emergency+vet+near+me"
          target="_blank"
          rel="noopener noreferrer"
          className={`btn-${isHigh ? 'danger' : 'secondary'} text-sm py-2 px-4`}
          id="find-vet-btn"
        >
          <MapPin size={14} />
          Find a Vet Near Me
        </a>
        {isHigh && (
          <a
            href="tel:+18005485748"
            className="btn-secondary text-sm py-2 px-4"
            id="emergency-vet-phone-btn"
          >
            <Phone size={14} />
            Emergency Vet Hotline
          </a>
        )}
      </div>

      <p className="text-white/30 text-xs border-t border-white/10 pt-3">
        ⚕️ This is NOT a medical diagnosis. Only a licensed veterinarian can properly assess your pet's health.
      </p>
    </motion.div>
  )
}
