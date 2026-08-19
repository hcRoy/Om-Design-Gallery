import { motion } from 'framer-motion'

/**
 * Consistent section rhythm: eyebrow label, heading, optional subhead,
 * fade+rise on scroll-in. Every public page section should use this so
 * vertical spacing and motion stay uniform without hand-tuning each one.
 */
export default function Section({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  tone = 'ivory',
  children,
  className = '',
}) {
  const toneClasses = {
    ivory: 'bg-ivory',
    sand: 'bg-sand',
    maroon: 'bg-maroon text-ivory',
  }

  const alignClasses = align === 'left' ? 'text-left items-start' : 'text-center items-center'

  return (
    <section className={`${toneClasses[tone]} py-20 md:py-28 px-6 ${className}`}>
      <div className={`max-w-6xl mx-auto flex flex-col ${alignClasses}`}>
        {(eyebrow || title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`mb-14 max-w-2xl ${align === 'left' ? '' : 'mx-auto'}`}
          >
            {eyebrow && (
              <p className={tone === 'maroon' ? 'eyebrow text-gold-light' : 'eyebrow'}>
                {eyebrow}
              </p>
            )}
            {title && <h2 className="text-3xl md:text-4xl mt-3 leading-tight">{title}</h2>}
            {subtitle && (
              <p
                className={`mt-4 text-base md:text-lg ${
                  tone === 'maroon' ? 'text-ivory/80' : 'text-ink-soft'
                }`}
              >
                {subtitle}
              </p>
            )}
          </motion.div>
        )}
        <div className="w-full">{children}</div>
      </div>
    </section>
  )
}
