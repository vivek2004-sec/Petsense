import { motion, AnimatePresence } from 'framer-motion'
import { PawPrint, Shield, X } from 'lucide-react'

export default function DisclaimerModal({ isOpen, onAccept }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative glass max-w-lg w-full p-8 space-y-6 rounded-2xl"
            id="disclaimer-modal"
          >
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal to-teal-600 flex items-center justify-center shadow-glow">
                <PawPrint size={28} className="text-navy" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold gradient-text">Welcome to PetSense</h2>
              <p className="text-white/60 text-sm">Before you begin, please read this important notice</p>
            </div>

            <div className="rounded-xl p-4 bg-amber/10 border border-amber/30 space-y-3">
              <div className="flex items-center gap-2 text-amber font-bold text-sm">
                <Shield size={16} />
                Important Health & Safety Notice
              </div>
              <ul className="text-sm text-white/70 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-teal mt-0.5">•</span>
                  PetSense is a <strong className="text-white">wellness awareness tool</strong>, not a veterinary diagnostic device.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal mt-0.5">•</span>
                  All predictions are based on behavioral pattern recognition and AI analysis.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal mt-0.5">•</span>
                  Results are <strong className="text-white">not a substitute</strong> for professional veterinary examination.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose mt-0.5">•</span>
                  If you suspect your pet is in pain or ill, <strong className="text-rose">consult a licensed veterinarian immediately</strong>.
                </li>
              </ul>
            </div>

            <button
              id="disclaimer-accept-btn"
              onClick={onAccept}
              className="btn-primary w-full justify-center"
            >
              <PawPrint size={16} />
              I Understand — Let's Get Started
            </button>

            <p className="text-center text-white/25 text-xs">
              By continuing, you agree to our{' '}
              <a href="/terms" className="text-teal hover:underline">Terms of Use</a>
              {' '}and{' '}
              <a href="/privacy" className="text-teal hover:underline">Privacy Policy</a>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
