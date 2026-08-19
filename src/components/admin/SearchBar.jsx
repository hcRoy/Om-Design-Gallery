import { IconSearch } from './icons.jsx'

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  filters,
  activeFilter,
  onFilter,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <label className="relative flex-1">
        <span className="sr-only">{placeholder}</span>
        <IconSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="admin-input !pl-10"
        />
      </label>
      {filters?.length ? (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5" role="tablist">
          {filters.map((f) => {
            const active = activeFilter === f.value
            return (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFilter(f.value)}
                className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide
                            transition-all duration-150 ${
                              active
                                ? 'bg-maroon text-ivory shadow-sm'
                                : 'bg-white text-ink-soft border border-ink/10 hover:border-ink/20 hover:text-ink'
                            }`}
              >
                {f.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
