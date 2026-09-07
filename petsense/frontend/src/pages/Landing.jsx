import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PawPrint, Camera, Mic, BarChart2, Shield, Zap, ChevronRight, Star } from 'lucide-react'
import DisclaimerModal from '../components/DisclaimerModal'

const FEATURES = [
  {
    icon: Camera,
    color: 'from-teal to-teal-600',
    title: 'Visual Emotion Analysis',
    desc: 'AI scans facial expressions, ear position, body posture, and tail position to classify emotional state in seconds.',
  },
  {
    icon: Shield,
    color: 'from-rose to-rose-600',
    title: 'Pain Indicator Detection',
    desc: 'Grimace-scale inspired analysis flags squinted eyes, muscle tension, and hunched posture as possible pain signals.',
  },
  {
    icon: Mic,
    color: 'from-purple to-purple-600',
    title: 'Audio Distress Classification',
    desc: 'Classifies barks, meows, and whines into emotional categories: playful, distressed, warning, pain-whine, content.',
  },
  {
    icon: BarChart2,
    color: 'from-amber to-amber-600',
    title: 'Trend Tracking',
    desc: 'Log scans over time and visualise your pet\'s emotional wellbeing and pain-risk trends with interactive charts.',
  },
]

const TESTIMONIALS = [
  { name: 'Sarah M.', pet: 'Labrador owner', text: 'PetSense helped me notice Buddy was anxious during thunderstorms before I could figure it out myself.', rating: 5 },
  { name: 'James K.', pet: 'Cat owner', text: 'The pain detection feature flagged early signs in my cat Mochi. Vet confirmed mild arthritis. So glad I caught it early.', rating: 5 },
  { name: 'Priya L.', pet: 'Shelter volunteer', text: 'We use PetSense to help assess anxious rescue dogs. It\'s become an invaluable triage aid at our shelter.', rating: 5 },
]

const EMOTIONS = ['😄 Happy', '😌 Relaxed', '😰 Anxious', '😨 Scared', '👀 Alert', '😤 Aggressive']

export default function Landing() {
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [currentEmotion, setCurrentEmotion] = useState(0)

  useEffect(() => {
    const seen = localStorage.getItem('petsense_disclaimer_seen')
    if (!seen) setShowDisclaimer(true)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEmotion(e => (e + 1) % EMOTIONS.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleDisclaimerAccept = () => {
    localStorage.setItem('petsense_disclaimer_seen', '1')
    setShowDisclaimer(false)
  }

  return (
    <div className="min-h-screen bg-hero-gradient relative">
      <div className="mesh-bg absolute inset-0 opacity-50 pointer-events-none" />
      <DisclaimerModal isOpen={showDisclaimer} onAccept={handleDisclaimerAccept} />

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-navy/70 backdrop-blur-xl border-b border-white/5 rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal to-teal-600 flex items-center justify-center">
              <PawPrint size={16} className="text-navy" />
            </div>
            <span className="font-bold text-lg gradient-text">PetSense</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"    className="btn-secondary py-2 px-4 text-sm">Sign in</Link>
            <Link to="/register" id="hero-cta-nav" className="btn-primary py-2 px-4 text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-teal/30 text-sm text-teal font-medium"
          >
            <Zap size={14} />
            AI-Powered Pet Wellness Analysis
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-7xl font-black leading-tight"
          >
            Your Pet Is Trying To{' '}
            <span className="gradient-text">Tell You</span>
            <br />
            Something
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
          >
            PetSense uses advanced computer vision and audio AI to translate your dog's or cat's
            body language and sounds into clear, plain-language emotional insights.
          </motion.p>

          {/* Rotating emotions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-3 text-2xl font-bold"
          >
            <span className="text-white/40 text-lg">Detects:</span>
            <motion.span
              key={currentEmotion}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="gradient-text"
            >
              {EMOTIONS[currentEmotion]}
            </motion.span>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Link to="/register" id="hero-cta-main" className="btn-primary text-base px-8 py-4">
              <PawPrint size={18} />
              Start Analyzing Free
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-4">
              Sign in
              <ChevronRight size={16} />
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-6 text-sm text-white/40"
          >
            <span>✓ No subscription required</span>
            <span>✓ Private by default</span>
            <span>✓ Dogs & cats supported</span>
          </motion.div>
        </div>

        {/* ── Hero Visual ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-16 max-w-2xl mx-auto"
        >
          <div className="glass p-6 rounded-3xl space-y-4 border border-teal/20 shadow-glow">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose" />
              <div className="w-3 h-3 rounded-full bg-amber" />
              <div className="w-3 h-3 rounded-full bg-teal" />
              <span className="text-white/30 text-xs ml-2">PetSense Analysis</span>
            </div>
            <div className="aspect-video bg-navy-50 rounded-2xl relative overflow-hidden flex items-center justify-center">
              <div className="text-6xl animate-float">🐕</div>
              <div className="scan-overlay" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="glass p-3 rounded-xl text-center">
                <div className="text-lg font-bold gradient-text">Happy</div>
                <div className="text-xs text-white/40">Emotion</div>
              </div>
              <div className="glass p-3 rounded-xl text-center">
                <div className="text-lg font-bold text-teal">94%</div>
                <div className="text-xs text-white/40">Confidence</div>
              </div>
              <div className="glass p-3 rounded-xl text-center">
                <div className="text-lg font-bold text-teal">Low</div>
                <div className="text-xs text-white/40">Pain Risk</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-black mb-4">
            Everything You Need To <span className="gradient-text">Understand</span> Your Pet
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            A complete multi-modal AI pipeline combining visual and audio analysis into one clear result.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass glass-hover p-6 space-y-4"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center`}>
                <f.icon size={22} className="text-white" />
              </div>
              <h3 className="text-xl font-bold">{f.title}</h3>
              <p className="text-white/55 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl font-black text-center mb-14">
          Trusted By <span className="gradient-text">Pet Owners</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 space-y-4"
            >
              <div className="flex gap-1">
                {[...Array(t.rating)].map((_, j) => <Star key={j} size={14} className="text-amber fill-amber" />)}
              </div>
              <p className="text-white/70 leading-relaxed italic">"{t.text}"</p>
              <div>
                <p className="font-semibold text-white">{t.name}</p>
                <p className="text-white/40 text-sm">{t.pet}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 max-w-3xl mx-auto text-center">
        <div className="glass p-12 space-y-6 border border-teal/20">
          <div className="text-5xl">🐾</div>
          <h2 className="text-4xl font-black">Ready to Listen to Your Pet?</h2>
          <p className="text-white/55 text-lg">Start your first analysis in under 60 seconds. No credit card required.</p>
          <Link to="/register" id="bottom-cta" className="btn-primary text-base px-8 py-4 inline-flex">
            <PawPrint size={18} />
            Get Started Free
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-white/30">
          <div className="flex items-center gap-2">
            <PawPrint size={14} className="text-teal" />
            <span>PetSense 2026 — Not a veterinary diagnostic device</span>
          </div>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms"   className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
