import { motion } from 'framer-motion'
import { OWNERS } from '../data/studio.js'

/** Per-photo focal point so studio headshots and office portraits crop consistently. */
const PHOTO_FOCUS = {
  'nilesh-sutariya': 'center 22%',
  'bhavesh-mangukiya': 'center 18%',
  'bhavdip-sutariya': 'center 12%',
  'ajay-sutariya': 'center 16%',
}

function OwnerPhoto({ owner }) {
  if (!owner.photo) {
    const initials = owner.name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()

    return (
      <div
        className="w-full h-full bg-gradient-to-br from-sand to-ivory flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="font-display text-4xl text-maroon/50">{initials}</span>
      </div>
    )
  }

  return (
    <img
      src={owner.photo}
      alt={owner.name}
      loading="lazy"
      decoding="async"
      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      style={{ objectPosition: PHOTO_FOCUS[owner.slug] ?? 'center 20%' }}
    />
  )
}

export default function OwnersGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
      {OWNERS.map((owner, i) => (
        <motion.article
          key={owner.slug}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, delay: i * 0.08 }}
          className="group bg-white rounded-xl overflow-hidden shadow-card border border-ink/5
                     hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >
          <div className="relative aspect-[4/5] overflow-hidden bg-sand">
            <OwnerPhoto owner={owner} />
            <div
              className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink/25 to-transparent pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-maroon via-gold to-teal"
              aria-hidden="true"
            />
          </div>
          <div className="px-4 py-5 text-center border-t border-ink/5">
            <h3 className="font-display text-lg md:text-xl leading-snug text-ink">{owner.name}</h3>
            <p className="text-xs text-ink-soft mt-1 tracking-wide uppercase">Co-owner</p>
          </div>
        </motion.article>
      ))}
    </div>
  )
}
