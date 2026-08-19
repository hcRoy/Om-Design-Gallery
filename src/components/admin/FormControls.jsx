export function Field({ label, hint, error, htmlFor, children }) {
  return (
    <div className={error ? '[&_input]:border-maroon/50 [&_textarea]:border-maroon/50 [&_select]:border-maroon/50' : ''}>
      {label && (
        <label htmlFor={htmlFor} className="admin-label">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-maroon font-medium" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>
      ) : null}
    </div>
  )
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex items-start gap-3 text-left w-full rounded-xl p-1 -m-1
                  transition-opacity duration-150 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`relative mt-0.5 shrink-0 w-10 h-6 rounded-full transition-colors duration-150 ${
          checked ? 'bg-maroon' : 'bg-ink/15'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm
                      transition-transform duration-150 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="block text-xs text-ink-soft mt-0.5">{description}</span>}
      </span>
    </button>
  )
}

export function FormSection({ title, description, children }) {
  return (
    <section className="space-y-4">
      <div className="pb-1 border-b border-ink/10">
        <h4 className="text-sm font-semibold text-ink">{title}</h4>
        {description && <p className="text-xs text-ink-soft mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  )
}
