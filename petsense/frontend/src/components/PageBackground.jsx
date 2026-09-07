import PageBackground from './PageBackground'

/** Softer ambient background — no harsh competing colors */
export default function PageBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute inset-0 bg-surface-base" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(82,183,136,0.08),transparent)]" />
    </div>
  )
}
