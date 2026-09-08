import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'

const EMOTION_SCORE = {
  happy: 5, relaxed: 4, neutral: 3, alert: 3, anxious: 2, scared: 1, aggressive: 1,
}
const PAIN_SCORE = { Low: 1, Medium: 2, High: 3 }

const EMOTION_ICONS = {
  5: '😄', 4: '😌', 3: '😐', 2: '😰', 1: '😨'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-navy/90 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[180px]">
      <p className="text-white/50 font-semibold mb-2">{label}</p>
      {payload.map((p, i) => {
        let displayValue = p.value;
        let icon = '';
        if (p.name === 'Emotion') {
            displayValue = Object.entries(EMOTION_SCORE).find(([,v]) => v === p.value)?.[0] || p.value;
            icon = EMOTION_ICONS[p.value] || '';
            displayValue = <span className="capitalize">{icon} {displayValue}</span>
        } else if (p.name === 'Pain Risk') {
            displayValue = Object.entries(PAIN_SCORE).find(([,v]) => v === p.value)?.[0] || p.value;
            displayValue = <span className="capitalize">{displayValue}</span>
        } else if (p.name === 'Confidence') {
            displayValue = `${p.value}%`;
        }
        
        return (
          <div key={i} className="flex items-center justify-between">
             <span className="text-white/70 font-medium">{p.name}</span>
             <span style={{ color: p.color }} className="font-bold">{displayValue}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function TrendChart({ history = [] }) {
  if (!history.length) {
    return (
      <div className="glass-strong p-8 flex flex-col items-center justify-center gap-4 text-white/30 min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl shadow-inner">
            📈
        </div>
        <p className="text-sm font-medium">No scan history yet. Run your first scan to start tracking trends.</p>
      </div>
    )
  }

  const data = history.map((scan) => ({
    date: format(new Date(scan.created_at), 'MMM d'),
    fullDate: format(new Date(scan.created_at), 'MMM d, HH:mm'),
    'Emotion':    EMOTION_SCORE[scan.emotion_label] ?? 3,
    'Pain Risk':  PAIN_SCORE[scan.pain_risk] ?? 1,
    'Confidence': scan.confidence != null ? Math.round(scan.confidence * 100) : null,
  }))

  return (
    <div className="space-y-6">
      {/* Emotion trend */}
      <div className="glass-strong p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal/5 rounded-full blur-3xl"></div>
        <h3 className="text-xs font-bold text-white/50 mb-6 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal shadow-[0_0_8px_rgba(0,212,180,0.8)]"></span>
            Emotional Wellbeing
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D4B4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00D4B4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis
              domain={[1, 5]}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              tickFormatter={(v) => ['', 'Distressed', 'Anxious', 'Neutral', 'Calm', 'Happy'][v] || v}
              axisLine={false}
              tickLine={false}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="Emotion"
              stroke="#00D4B4"
              strokeWidth={3}
              fill="url(#tealGradient)"
              dot={{ fill: '#0E1217', r: 4, strokeWidth: 2, stroke: '#00D4B4' }}
              activeDot={{ r: 6, fill: '#00EECF', strokeWidth: 0, shadow: '0 0 10px #00EECF' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pain risk trend */}
      <div className="glass-strong p-5 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose/5 rounded-full blur-3xl"></div>
        <h3 className="text-xs font-bold text-white/50 mb-6 uppercase tracking-widest flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-rose shadow-[0_0_8px_rgba(224,122,122,0.8)]"></span>
             Pain Risk & Confidence
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis
              yAxisId="left"
              domain={[1, 3]}
              ticks={[1, 2, 3]}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              tickFormatter={(v) => ['', 'Low', 'Medium', 'High'][v] || v}
              axisLine={false}
              tickLine={false}
              dx={-10}
            />
            <YAxis
               yAxisId="right"
               orientation="right"
               domain={[0, 100]}
               tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
               axisLine={false}
               tickLine={false}
               dx={10}
               tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
            <Line
              yAxisId="left"
              type="stepAfter"
              dataKey="Pain Risk"
              stroke="#FF6B8A"
              strokeWidth={3}
              dot={{ fill: '#0E1217', r: 4, strokeWidth: 2, stroke: '#FF6B8A' }}
              activeDot={{ r: 6, fill: '#FF8FA3', strokeWidth: 0 }}
            />
             <Line
              yAxisId="right"
              type="monotone"
              dataKey="Confidence"
              stroke="#A8B8E0"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4, fill: '#A8B8E0', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
