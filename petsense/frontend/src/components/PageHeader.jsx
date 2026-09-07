/** Reusable page header with optional icon and subtitle */
export default function PageHeader({ icon: Icon, iconClass = 'from-teal to-teal-600', title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${iconClass} flex items-center justify-center shadow-glow shrink-0`}>
            <Icon size={22} className="text-white" />
          </div>
        )}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{title}</h1>
          {subtitle && <p className="text-white/50 mt-1.5 max-w-xl leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex gap-2 flex-wrap">{children}</div>}
    </div>
  )
}
