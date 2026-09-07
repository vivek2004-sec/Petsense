import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'

const EMOTION_SCORE = {
  happy: 5, relaxed: 4, neutral: 3, alert: 3, anxious: 2, scared: 1, aggressive: 1,
}
const PAIN_SCORE = { Low: 1, Medium: 2, High: 3 }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass p-3 text-xs space-y-1 min-w-[160px]">
      <p className="text-white/50 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.name === 'Emotion' ? Object.entries(EMOTION_SCORE).find(([,v]) => v === p.value)?.[0] : p.name === 'Pain Risk' ? Object.entries(PAIN_SCORE).find(([,v]) => v === p.value)?.[0] : p.value}
        </p>
      ))}
    </div>
  )
}

export default function TrendChart({ history = [] }) {
  if (!history.length) {
    return (
      <div className="glass p-8 flex flex-col items-center justify-center gap-3 text-white/30">
        <span className="text-4xl">📈</span>
        <p className="text-sm">No scan history yet. Run your first scan to start tracking trends.</p>
      </div>
    )
  }

  const data = history.map((scan) => ({
    date: format(new Date(scan.created_at), 'MMM d'),
    fullDate: format(new Date(scan.created_at), 'MMM d, HH:mm'),
    'Emotion':    EMOTION_SCORE[scan.emotion_label] ?? 3,
    'Pain Risk':  PAIN_SCORE[scan.pain_risk] ?? 1,
    'Confidence': scan.confidence != null ? Math.round(scan.confidence * 100) : null,
    emotion: scan.emotion_label,
    painRisk: scan.pain_risk,
  }))

  return (
    <div className="space-y-6">
      {/* Emotion trend */}
      <div className="glass p-5 rounded-2xl">
        <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">Emotional Wellbeing Trend</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D4B4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00D4B4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} />
            <YAxis
              domain={[1, 5]}
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              tickFormatter={(v) => ['', 'Distressed', 'Anxious', 'Neutral', 'Calm', 'Happy'][v] || v}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="Emotion"
              stroke="#00D4B4"
              strokeWidth={2}
              fill="url(#tealGradient)"
              dot={{ fill: '#00D4B4', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#00EECF' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pain risk trend */}
      <div className="glass p-5 rounded-2xl">
        <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">Pain Risk Trend</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} />
            <YAxis
              domain={[1, 3]}
              ticks={[1, 2, 3]}
              tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
              tickFormatter={(v) => ['', 'Low', 'Medium', 'High'][v] || v}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="Pain Risk"
              stroke="#FF6B8A"
              strokeWidth={2}
              dot={{ fill: '#FF6B8A', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#FF8FA3' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
