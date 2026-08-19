export default function StatCard({ icon, label, value, tint = 'maroon', hint }) {
  const tints = {
    maroon: 'bg-maroon/10 text-maroon',
    teal: 'bg-teal/10 text-teal',
    gold: 'bg-gold-light/60 text-gold-dark',
    ink: 'bg-ink/8 text-ink',
  }

  return (
    <article className="admin-card p-5 sm:p-6 transition-shadow duration-150 hover:shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${tints[tint] ?? tints.maroon}`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-5 font-display text-3xl md:text-4xl text-maroon tabular-nums leading-none tracking-tight">
        {value}
      </p>
      <p className="mt-2 text-sm font-medium text-ink">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>}
    </article>
  )
}
