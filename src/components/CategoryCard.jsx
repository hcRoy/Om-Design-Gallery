import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function CategoryCard({ to, name, description, image, imageAlt }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <Link
        to={to}
        className="group flex flex-col h-full bg-white rounded-lg overflow-hidden shadow-card border border-ink/5"
      >
        <div className="relative aspect-square bg-ivory overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={imageAlt || name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center px-6">
              <span className="font-display text-gold/50 text-2xl md:text-3xl tracking-wide text-center leading-snug uppercase">
                {name}
              </span>
            </div>
          )}
        </div>
        <div className="p-5 md:p-6 flex flex-col flex-1 text-center">
          <h3 className="text-xl font-display text-ink leading-snug">{name}</h3>
          {description && (
            <p className="text-sm text-ink-soft mt-2 leading-relaxed">{description}</p>
          )}
          <span className="mt-auto pt-4 text-sm font-semibold text-maroon inline-flex items-center justify-center gap-1 group-hover:gap-2 transition-all duration-200">
            View designs
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </motion.div>
  )
}
