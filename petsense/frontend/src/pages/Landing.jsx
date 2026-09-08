import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { PawPrint, Camera, Mic, BarChart2, Shield, Zap, ChevronRight, Star, Heart } from 'lucide-react'
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

const DEMO_STATES = [
  { emoji: '😄', emotion: 'Happy', conf: '94%', pain: 'Low', color: 'text-teal' },
  { emoji: '😰', emotion: 'Anxious', conf: '82%', pain: 'Medium', color: 'text-amber' },
  { emoji: '😌', emotion: 'Relaxed', conf: '88%', pain: 'Low', color: 'text-teal' },
  { emoji: '😨', emotion: 'Scared', conf: '76%', pain: 'High', color: 'text-rose' },
]

// Animated Counter Component
function AnimatedCounter({ end, label, suffix = '+' }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const duration = 2000
    const increment = end / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [end])

  return (
    <div className="text-center">
      <div className="text-4xl font-black text-white">{count.toLocaleString()}{suffix}</div>
      <div className="text-white/50 text-sm mt-1 uppercase tracking-wider font-semibold">{label}</div>
    </div>
  )
}

export default function Landing() {
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [demoIndex, setDemoIndex] = useState(0)

  useEffect(() => {
    const seen = localStorage.getItem('petsense_disclaimer_seen')
    if (!seen) setShowDisclaimer(true)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setDemoIndex(prev => (prev + 1) % DEMO_STATES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleDisclaimerAccept = () => {
    localStorage.setItem('petsense_disclaimer_seen', '1')
    setShowDisclaimer(false)
  }

  const currentDemo = DEMO_STATES[demoIndex]

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      {/* Animated Aurora Background */}
      <div className="aurora-bg"></div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {[...Array(15)].map((_, i) => (
             <div 
               key={i} 
               className="hero-particle"
               style={{
                 left: `${Math.random() * 100}%`,
                 top: `${Math.random() * 100}%`,
                 width: `${Math.random() * 6 + 2}px`,
                 height: `${Math.random() * 6 + 2}px`,
                 animationDelay: `${Math.random() * 5}s`,
                 animationDuration: `${Math.random() * 10 + 10}s`
               }}
             ></div>
          ))}
      </div>

      <DisclaimerModal isOpen={showDisclaimer} onAccept={handleDisclaimerAccept} />

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-navy/70 backdrop-blur-xl border-b border-white/5 rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal to-teal-600 flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_0_10px_rgba(0,212,180,0.4)]">
              <PawPrint size={16} className="text-navy" />
            </div>
            <span className="font-bold text-lg text-white">Pet<span className="text-accent">Sense</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"    className="btn-secondary py-2 px-4 text-sm hidden sm:inline-flex">Sign in</Link>
            <Link to="/register" id="hero-cta-nav" className="btn-primary py-2 px-4 text-sm relative z-50">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-strong border border-teal/30 text-sm text-teal font-semibold shadow-[0_0_20px_rgba(0,212,180,0.15)]"
          >
            <Zap size={14} className="animate-pulse" />
            AI-Powered Pet Wellness Analysis
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-7xl font-black leading-tight tracking-tight"
          >
            Your Pet Is Trying To{' '}
            <br className="hidden sm:block" />
            <span className="gradient-text">Tell You</span> Something
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed"
          >
            Translate your dog's or cat's body language, coat health, and sounds into clear, plain-language insights instantly.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Link to="/register" id="hero-cta-main" className="btn-primary text-base px-8 py-4 shadow-[0_10px_30px_rgba(0,212,180,0.3)] hover:-translate-y-1">
              <PawPrint size={18} />
              Start Analyzing Free
            </Link>
          </motion.div>
        </div>

        {/* ── Hero Visual Mockup ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, type: "spring", bounce: 0.4 }}
          className="mt-16 max-w-3xl mx-auto relative z-20"
        >
          <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-br from-teal/30 via-purple/30 to-teal/30 opacity-50 blur-xl"></div>
          <div className="glass-strong p-2 rounded-[2.5rem] relative">
            <div className="bg-navy/90 rounded-[2rem] p-6 sm:p-8 overflow-hidden relative border border-white/5">
                {/* Mockup Header */}
                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal to-purple p-[2px]">
                            <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=150&h=150" alt="Dog" className="w-full h-full object-cover rounded-full border-2 border-navy" />
                        </div>
                        <div>
                            <p className="font-bold text-white leading-tight">Live Analysis</p>
                            <p className="text-teal text-xs font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse"></span> Scanning active</p>
                        </div>
                    </div>
                </div>

                {/* Animated Demo Content */}
                <div className="grid sm:grid-cols-2 gap-6 items-center">
                    <div className="aspect-square sm:aspect-[4/3] rounded-2xl bg-black/40 border border-white/10 relative overflow-hidden flex items-center justify-center">
                        <img src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600" alt="Dog scan demo" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                        
                        {/* Scanning animation overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal/20 to-transparent h-[200%] animate-scan-line pointer-events-none"></div>
                        <div className="absolute top-1/4 left-1/4 w-8 h-8 border-2 border-teal rounded-full animate-ping"></div>
                        <div className="absolute top-2/3 right-1/4 w-4 h-4 border border-rose rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="space-y-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={demoIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="glass p-5 rounded-2xl space-y-4 border-white/10 shadow-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl">{currentDemo.emoji}</div>
                                    <div>
                                        <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Detected State</p>
                                        <p className={`text-2xl font-bold ${currentDemo.color}`}>{currentDemo.emotion}</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                                    <div>
                                        <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Confidence</p>
                                        <p className="font-bold text-white">{currentDemo.conf}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Pain Risk</p>
                                        <p className={`font-bold ${currentDemo.pain === 'Low' ? 'text-teal' : currentDemo.pain === 'High' ? 'text-rose' : 'text-amber'}`}>{currentDemo.pain}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Stats Section ─────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02] relative z-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-3 gap-8">
            <AnimatedCounter end={50000} label="Scans Completed" />
            <AnimatedCounter end={94} label="Accuracy Rating" suffix="%" />
            <AnimatedCounter end={12000} label="Happy Pets" />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-black mb-4">
            Everything You Need To <span className="gradient-text">Understand</span> Your Pet
          </h2>
          <p className="text-white/50 max-w-xl mx-auto text-lg">
            A complete multi-modal AI pipeline combining visual and audio analysis into one clear result.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass-strong glass-hover p-8 space-y-5"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg`}>
                <f.icon size={26} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">{f.title}</h3>
              <p className="text-white/60 leading-relaxed text-[15px]">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
             <h2 className="text-4xl font-black mb-4">How It <span className="gradient-text">Works</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-[2px] bg-gradient-to-r from-transparent via-teal/30 to-transparent"></div>
              
              {[
                  { step: '1', title: 'Upload', desc: 'Snap a quick photo or record a short audio clip of your pet.' },
                  { step: '2', title: 'Analyze', desc: 'Our AI processes thousands of data points to evaluate their state.' },
                  { step: '3', title: 'Understand', desc: 'Get a clear, actionable report on their health and emotional wellbeing.' }
              ].map((s, i) => (
                  <motion.div 
                     key={i}
                     initial={{ opacity: 0, y: 20 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true }}
                     transition={{ delay: i * 0.2 }}
                     className="relative text-center space-y-4"
                  >
                      <div className="w-16 h-16 rounded-2xl bg-teal/10 border-2 border-teal mx-auto flex items-center justify-center text-2xl font-black text-teal relative z-10 bg-navy shadow-[0_0_20px_rgba(0,212,180,0.2)]">
                          {s.step}
                      </div>
                      <h3 className="text-xl font-bold text-white">{s.title}</h3>
                      <p className="text-white/50 px-4">{s.desc}</p>
                  </motion.div>
              ))}
          </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
        <h2 className="text-4xl font-black text-center mb-16">
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
              className="glass-strong p-8 space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                  <div className="flex gap-1">
                    {[...Array(t.rating)].map((_, j) => <Star key={j} size={16} className="text-amber fill-amber" />)}
                  </div>
                  <p className="text-white/80 leading-relaxed text-[15px]">"{t.text}"</p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                     <Heart size={16} className="text-teal" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-white/40 text-xs">{t.pet}</p>
                  </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center relative z-10">
        <div className="glass-strong p-12 sm:p-16 rounded-[2.5rem] space-y-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-teal/10 to-transparent pointer-events-none"></div>
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-teal to-purple flex items-center justify-center shadow-lg">
             <PawPrint size={32} className="text-white" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black">Ready to Listen to Your Pet?</h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto">Start your first analysis in under 60 seconds. No credit card required. Free forever for basic scans.</p>
          <Link to="/register" id="bottom-cta" className="btn-primary text-base px-10 py-5 inline-flex mt-4 shadow-[0_10px_30px_rgba(0,212,180,0.2)]">
            Get Started For Free
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8 px-4 sm:px-6 relative z-10 bg-black/20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-white/40">
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
