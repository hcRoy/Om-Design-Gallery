import { IconAlert } from './icons.jsx'

export default function Alert({ children, tone = 'error' }) {
  const styles =
    tone === 'warn'
      ? 'bg-gold-light/35 border-gold-dark/30 text-ink'
      : 'bg-maroon/8 border-maroon/20 text-maroon'

  return (
    <div
      role="alert"
      className={`mb-6 flex items-start gap-3 text-sm border rounded-xl px-4 py-3 ${styles}`}
    >
      <IconAlert className="w-4 h-4 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  )
}
