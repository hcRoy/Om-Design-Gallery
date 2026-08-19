import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

/**
 * Signature element: a running-stitch thread line drawn with SVG +
 * Framer Motion (stroke-dashoffset reveal on scroll-into-view). Used as
 * the hero motif and as section dividers site-wide instead of plain
 * hairlines, so it's a structural device, not a one-off decoration.
 *
 * variant="wave"  — gentle undulating line (section dividers)
 * variant="stitch" — tighter running-stitch dash pattern (hero)
 */
export default function ThreadDivider({ variant = 'wave', color = '#C9A227', className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const path =
    variant === 'stitch'
      ? 'M0 30 Q 60 0, 120 30 T 240 30 T 360 30 T 480 30 T 600 30 T 720 30 T 840 30 T 960 30 T 1080 30 T 1200 30'
      : 'M0 20 C 100 40, 200 0, 300 20 S 500 40, 600 20 S 800 0, 900 20 S 1100 40, 1200 20'

  return (
    <svg
      ref={ref}
      viewBox="0 0 1200 40"
      className={`w-full h-8 ${className}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={variant === 'stitch' ? 2.5 : 2}
        strokeLinecap="round"
        strokeDasharray={variant === 'stitch' ? '14 10' : '3 6'}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ duration: 1.6, ease: 'easeInOut' }}
      />
    </svg>
  )
}
