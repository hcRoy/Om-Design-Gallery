import ThreadDivider from './ThreadDivider.jsx'

export default function PageHero({ eyebrow, title, children, size = 'md' }) {
  const padding = size === 'lg' ? 'pt-24 pb-20 md:pt-32 md:pb-28' : 'pt-20 pb-16 md:pt-24 md:pb-20'

  return (
    <section className="relative overflow-hidden text-ivory">
      <div className="absolute inset-0 page-hero-gradient" />
      <div className="absolute inset-0 opacity-[0.14] pointer-events-none" aria-hidden="true">
        <ThreadDivider variant="wave" color="#C9A227" className="absolute top-8 left-0 h-12" />
        <ThreadDivider variant="stitch" color="#C9A227" className="absolute bottom-6 left-0 h-10" />
      </div>
      <div className={`relative max-w-3xl mx-auto px-6 text-center ${padding}`}>
        {eyebrow && <p className="eyebrow text-gold-light">{eyebrow}</p>}
        {title && (
          <h1 className="text-4xl md:text-5xl mt-4 leading-tight text-ivory">{title}</h1>
        )}
        {children && (
          <div className="mt-5 text-ivory/80 leading-relaxed max-w-xl mx-auto">{children}</div>
        )}
        <ThreadDivider color="#C9A227" className="mt-10 max-w-xs mx-auto opacity-80 h-6" />
      </div>
    </section>
  )
}
