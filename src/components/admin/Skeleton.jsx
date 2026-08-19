export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="admin-card overflow-hidden" aria-hidden="true">
      <div className="px-5 py-3.5 bg-sand/40 border-b border-ink/8 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 w-20 rounded bg-ink/10 animate-pulse" />
        ))}
      </div>
      <div className="divide-y divide-ink/5">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-sand animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-1/3 rounded bg-ink/10 animate-pulse" />
              <div className="h-3 w-1/5 rounded bg-ink/5 animate-pulse" />
            </div>
            <div className="h-3 w-16 rounded bg-ink/10 animate-pulse hidden sm:block" />
            <div className="h-6 w-14 rounded-full bg-ink/10 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="admin-card p-5 animate-pulse" aria-hidden="true">
      <div className="w-10 h-10 rounded-xl bg-sand mb-5" />
      <div className="h-8 w-16 rounded bg-ink/10 mb-2" />
      <div className="h-3 w-28 rounded bg-ink/5" />
    </div>
  )
}
