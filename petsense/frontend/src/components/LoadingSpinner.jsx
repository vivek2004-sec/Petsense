import { PawPrint } from 'lucide-react'

const STEPS = ['Reading image...', 'Analyzing coat & skin...', 'Detecting diseases...', 'Generating advice...']

export default function LoadingSpinner({ label = 'Analyzing...', fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-2 border-teal/15" />
        <div className="absolute inset-0 rounded-full border-2 border-teal border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full border border-purple/20 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <PawPrint size={22} className="text-teal animate-pulse" />
        </div>
      </div>
      {label && (
        <div className="text-center space-y-2">
          <p className="text-white/80 text-sm font-semibold">{label}</p>
          <div className="flex gap-1.5 justify-center">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-teal animate-shimmer"
                style={{ animationDelay: `${i * 0.4}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/85 backdrop-blur-md">
        <div className="glass-strong p-10 rounded-3xl">{content}</div>
      </div>
    )
  }

  return <div className="flex items-center justify-center py-16">{content}</div>
}
