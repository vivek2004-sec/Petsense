import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PawPrint, Save, ArrowLeft } from 'lucide-react'
import { petsApi } from '../api/pets'
import toast from 'react-hot-toast'

export default function NewPet() {
  const navigate = useNavigate()
  const [form, setForm]     = useState({ name: '', species: 'dog', breed: '', birth_date: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, birth_date: form.birth_date || null, breed: form.breed || null, notes: form.notes || null }
      const pet = await petsApi.create(payload)
      toast.success(`${pet.name} added! 🐾`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add pet')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 sm:px-6 max-w-2xl mx-auto page-enter">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6 text-sm">
        <ArrowLeft size={16} /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 space-y-7">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber to-amber-600 flex items-center justify-center mx-auto">
            <PawPrint size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-black">Add a New Pet</h1>
          <p className="text-white/50 text-sm">Set up a profile to start tracking their wellbeing</p>
        </div>

        <form id="new-pet-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Species selector */}
          <div>
            <label className="form-label">Species *</label>
            <div className="grid grid-cols-2 gap-3">
              {[{ val: 'dog', emoji: '🐕', label: 'Dog' }, { val: 'cat', emoji: '🐈', label: 'Cat' }].map(({ val, emoji, label }) => (
                <button
                  key={val}
                  type="button"
                  id={`species-${val}`}
                  onClick={() => setForm(f => ({ ...f, species: val }))}
                  className={`p-4 rounded-xl border-2 transition-all font-semibold flex items-center justify-center gap-2 text-lg ${
                    form.species === val
                      ? 'border-teal bg-teal/10 text-teal'
                      : 'border-white/10 bg-white/3 text-white/50 hover:border-white/30'
                  }`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="pet-name" className="form-label">Name *</label>
            <input id="pet-name" type="text" value={form.name} onChange={set('name')}
              className="input-field" placeholder="e.g. Buddy, Whiskers" required />
          </div>

          <div>
            <label htmlFor="pet-breed" className="form-label">Breed <span className="text-white/25 normal-case">(optional)</span></label>
            <input id="pet-breed" type="text" value={form.breed} onChange={set('breed')}
              className="input-field" placeholder="e.g. Labrador Retriever" />
          </div>

          <div>
            <label htmlFor="pet-dob" className="form-label">Date of Birth <span className="text-white/25 normal-case">(optional)</span></label>
            <input id="pet-dob" type="date" value={form.birth_date} onChange={set('birth_date')}
              className="input-field" max={new Date().toISOString().split('T')[0]} />
          </div>

          <div>
            <label htmlFor="pet-notes" className="form-label">Notes <span className="text-white/25 normal-case">(optional)</span></label>
            <textarea id="pet-notes" value={form.notes} onChange={set('notes')}
              className="input-field resize-none h-24"
              placeholder="Any medical history, temperament notes, etc." />
          </div>

          <button id="save-pet-btn" type="submit" disabled={loading} className="btn-primary w-full justify-center">
            {loading ? <div className="w-4 h-4 border-2 border-navy/40 border-t-navy rounded-full animate-spin" /> : <Save size={16} />}
            {loading ? 'Saving...' : 'Add Pet'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
