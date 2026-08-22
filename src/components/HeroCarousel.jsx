import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import ThreadDivider from './ThreadDivider.jsx'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/**
 * Full-bleed homepage hero carousel. When `slides` is empty, Home keeps
 * its static gradient hero instead — this component is only mounted when
 * there is at least one active slide.
 */
export default function HeroCarousel({ slides }) {
  const reducedMotion = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const count = slides.length
  const slide = slides[index]

  useEffect(() => {
    if (count <= 1 || reducedMotion) return undefined
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count)
    }, 6000)
    return () => window.clearInterval(id)
  }, [count, reducedMotion, index])

  const go = (next) => setIndex(((next % count) + count) % count)

  const inner = (
    <>
      <img
        src={slide.image_url}
        alt={slide.title || 'Featured design'}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-maroon-dark/85 via-maroon/55 to-maroon/25" />
      <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 w-full">
        <motion.div
          key={slide.id}
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="max-w-2xl"
        >
          <p className="eyebrow text-gold-light">Om Design &amp; Classes</p>
          {slide.title ? (
            <h1 className="text-4xl md:text-6xl mt-5 leading-[1.08] text-ivory">{slide.title}</h1>
          ) : (
            <h1 className="text-4xl md:text-6xl mt-5 leading-[1.08] text-ivory">
              Embroidery designs,{' '}
              <span className="italic text-gold-light">stitch-ready</span> for your machine.
            </h1>
          )}
          {slide.subtitle && (
            <p className="mt-6 text-base md:text-lg text-ivory/80 max-w-md leading-relaxed">
              {slide.subtitle}
            </p>
          )}
              <div className="mt-9 flex flex-wrap gap-4">
                {slide.link_url ? (
                  /^https?:\/\//i.test(slide.link_url) ? (
                    <a href={slide.link_url} className="btn-light" target="_blank" rel="noopener noreferrer">
                      Explore
                    </a>
                  ) : (
                    <Link to={slide.link_url} className="btn-light">
                      Explore
                    </Link>
                  )
                ) : (
                  <Link to="/designs" className="btn-light">
                    Browse all designs
                  </Link>
                )}
                <Link to="/categories" className="btn-ghost-light">
                  Explore categories
                </Link>
              </div>
        </motion.div>
      </div>
    </>
  )

  return (
    <section className="relative overflow-hidden text-ivory min-h-[78vh] flex items-center">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={slide.id}
          className="absolute inset-0"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {inner}
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <div className="absolute bottom-8 left-0 right-0 z-10 flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
            className="w-9 h-9 rounded-full border border-ivory/40 text-ivory text-sm hover:bg-ivory/15"
          >
            ‹
          </button>
          <div className="flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-6 bg-gold-light' : 'w-2 bg-ivory/40 hover:bg-ivory/70'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(index + 1)}
            className="w-9 h-9 rounded-full border border-ivory/40 text-ivory text-sm hover:bg-ivory/15"
          >
            ›
          </button>
        </div>
      )}
    </section>
  )
}

/** Static fallback hero used when no carousel slides are configured. */
export function StaticHomeHero() {
  return (
    <section className="relative overflow-hidden text-ivory min-h-[78vh] flex items-center">
      <div className="absolute inset-0 page-hero-gradient" />
      <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden="true">
        <ThreadDivider variant="wave" color="#C9A227" className="absolute top-[18%] left-0 h-16" />
        <ThreadDivider variant="stitch" color="#E0C368" className="absolute top-[42%] left-0 h-20" />
        <ThreadDivider variant="wave" color="#C9A227" className="absolute bottom-[16%] left-0 h-14" />
      </div>
      <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 w-full">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-2xl"
        >
          <p className="eyebrow text-gold-light">Digital embroidery designs</p>
          <h1 className="text-4xl md:text-6xl mt-5 leading-[1.08] text-ivory">
            Embroidery designs,{' '}
            <span className="italic text-gold-light">stitch-ready</span> for your machine.
          </h1>
          <p className="mt-6 text-base md:text-lg text-ivory/80 max-w-md leading-relaxed">
            Drawn by hand in Surat, digitised as DST, EMB, DHE and DHP —
            so every border, booti and jaal stitches out exactly as it was drawn.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link to="/designs" className="btn-light">
              Browse all designs
            </Link>
            <Link to="/categories" className="btn-ghost-light">
              Explore categories
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
