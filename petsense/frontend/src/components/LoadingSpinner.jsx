import { PawPrint, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const TIPS = [
  "Checking coat texture and shine...",
  "Analyzing skin exposure ratios...",
  "Looking for signs of redness or irritation...",
  "Evaluating posture and body language...",
  "Comparing with thousands of healthy pets...",
  "Assessing possible pain indicators...",
]

export default function LoadingSpinner({ label = 'Analyzing...', fullScreen = false }) {
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((current) => (current + 1) % TIPS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const content = (
    <div className="flex flex-col items-center gap-8 max-w-sm mx-auto">
      {/* Animated Paw Print Logo */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Pulsing background rings */}
        <div className="absolute inset-0 rounded-full bg-teal/5 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-2 rounded-full bg-teal/10 animate-pulse" />
        
        {/* Spinning border rings */}
        <div className="absolute inset-0 rounded-full border border-teal/20" />
        <div className="absolute inset-0 rounded-full border-[3px] border-teal border-t-transparent animate-spin" style={{ animationDuration: '1.5s' }} />
        <div className="absolute inset-3 rounded-full border border-purple/30 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
        
        {/* Center Icon */}
        <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-teal/20 to-teal/5 border border-teal/30 flex items-center justify-center backdrop-blur-sm shadow-[0_0_15px_rgba(0,212,180,0.3)]">
          <PawPrint size={24} className="text-accent animate-pulse" />
        </div>
      </div>

      <div className="text-center space-y-4 w-full">
        {label && (
          <h3 className="text-white font-bold text-lg tracking-wide">{label}</h3>
        )}
        
        {/* Rotating Tips */}
        <div className="h-6 relative overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={tipIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-white/50 text-sm flex items-center gap-2 font-medium"
            >
              <Sparkles size={12} className="text-teal" />
              {TIPS[tipIndex]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Animated dots */}
        <div className="flex gap-2 justify-center pt-2">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0.2 }}
              animate={{ scale: [0.5, 1, 0.5], opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
              className="w-1.5 h-1.5 rounded-full bg-teal"
            />
          ))}
        </div>
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/90 backdrop-blur-xl transition-all duration-500">
        <div className="glass-strong p-12 rounded-3xl border border-teal/10 shadow-[0_0_50px_rgba(0,212,180,0.1)] w-full max-w-md mx-4 relative overflow-hidden">
            {/* Subtle background glow inside the modal */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal/5 rounded-full blur-3xl pointer-events-none"></div>
            {content}
        </div>
      </div>
    )
  }

  return <div className="flex items-center justify-center py-20">{content}</div>
}
