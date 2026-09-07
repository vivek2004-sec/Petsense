import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PawPrint, Camera, BarChart2, ChevronRight } from 'lucide-react'

const SPECIES_EMOJI = { dog: '🐕', cat: '🐈' }

export default function PetCard({ pet, latestScan, index = 0 }) {
  const emoji = SPECIES_EMOJI[pet.species] || '🐾'
  const photoUrl = pet.photo_url
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/uploads/${pet.photo_url}`
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass glass-hover p-5 space-y-4 ring-1 ring-white/5 hover:ring-teal/20 transition-all duration-300"
      id={`pet-card-${pet.id}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={pet.name}
            className="w-14 h-14 rounded-xl object-cover border border-white/10"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal/20 to-purple/20 border border-white/10 flex items-center justify-center text-2xl">
            {emoji}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-white truncate">{pet.name}</h3>
          <p className="text-white/50 text-sm capitalize">
            {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}
          </p>
        </div>
      </div>

      {/* Latest scan snippet */}
      {latestScan && (
        <div className="glass p-3 rounded-xl text-sm">
          <p className="text-white/40 text-xs mb-1 uppercase tracking-wider">Last scan</p>
          <div className="flex items-center justify-between">
            <span className="capitalize font-semibold text-white">{latestScan.emotion_label}</span>
            <span className={`badge text-xs ${
              latestScan.pain_risk === 'High' ? 'badge-high' :
              latestScan.pain_risk === 'Medium' ? 'badge-medium' : 'badge-low'
            }`}>
              {latestScan.pain_risk} risk
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          to={`/scan/upload?pet=${pet.id}&species=${pet.species}`}
          className="btn-primary text-sm py-2 px-4 flex-1 justify-center"
          id={`scan-btn-${pet.id}`}
        >
          <Camera size={14} />
          Scan
        </Link>
        <Link
          to={`/pets/${pet.id}/history`}
          className="btn-secondary text-sm py-2 px-3"
          id={`history-btn-${pet.id}`}
        >
          <BarChart2 size={14} />
        </Link>
      </div>
    </motion.div>
  )
}
