export default function Tooltip({ label, children }) {
  return (
    <span className="relative inline-flex group/tip">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                   whitespace-nowrap rounded-md bg-ink text-ivory text-[11px] font-medium
                   px-2 py-1 opacity-0 scale-95 group-hover/tip:opacity-100 group-hover/tip:scale-100
                   group-focus-within/tip:opacity-100 group-focus-within/tip:scale-100
                   transition-all duration-150 z-20 shadow-card"
      >
        {label}
      </span>
    </span>
  )
}
