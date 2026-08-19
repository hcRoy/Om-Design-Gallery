const variants = {
  active: 'bg-teal/10 text-teal ring-teal/15',
  draft: 'bg-ink/[0.06] text-ink-soft ring-ink/10',
  featured: 'bg-gold-light/50 text-gold-dark ring-gold/25',
  admin: 'bg-maroon/10 text-maroon ring-maroon/15',
  customer: 'bg-sand text-ink-soft ring-ink/10',
  format: 'bg-ivory text-ink ring-ink/10',
  paid: 'bg-teal/10 text-teal ring-teal/15',
  pending: 'bg-gold-light/50 text-gold-dark ring-gold/25',
  failed: 'bg-maroon/10 text-maroon ring-maroon/15',
}

export default function Badge({ children, variant = 'draft', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ring-1 ${variants[variant] ?? variants.draft} ${className}`}
    >
      {children}
    </span>
  )
}
