export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-sand text-maroon flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {description && (
        <p className="text-sm text-ink-soft mt-1.5 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
