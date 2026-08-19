export default function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] md:text-3xl text-maroon tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">{description}</p>
        )}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
