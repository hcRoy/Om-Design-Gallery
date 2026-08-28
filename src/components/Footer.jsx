import { useState } from 'react'
import { Link } from 'react-router-dom'
import ThreadDivider from './ThreadDivider.jsx'
import BrandMark from './BrandMark.jsx'
import { STUDIO } from '../data/studio.js'

/**
 * JUDGMENT CALL: newsletter form has no backend yet — there's no
 * `subscribers` table in the schema you provided. It currently just
 * shows a confirmation state locally. Flagging so you can decide
 * whether to add a table + Supabase insert here, or wire it to an
 * external tool (Mailchimp etc.) in a later phase.
 */
export default function Footer() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email) return
    setSubmitted(true)
  }

  return (
    <footer className="relative bg-maroon-dark text-ivory overflow-hidden">
      <div className="absolute inset-x-0 top-0 opacity-40 pointer-events-none" aria-hidden="true">
        <ThreadDivider color="#C9A227" className="h-10" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-10">
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <BrandMark to="/" inverted size="lg" />
            <p className="text-sm text-ivory/70 mt-5 leading-relaxed">
              Machine-ready embroidery designs, drawn from tradition and
              built for the modern hoop. Licensed for stitching, not resale.
            </p>
            <div className="mt-6">
              <p className="eyebrow text-gold-light mb-3">Join our newsletter</p>
              {submitted ? (
                <p className="text-sm text-ivory/90">Thank you — you&rsquo;re on the list.</p>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-ivory/10 border border-ivory/25 rounded-sm px-4 py-2.5
                               text-sm placeholder:text-ivory/50
                               focus:outline-none focus:border-gold-light"
                  />
                  <button
                    type="submit"
                    className="btn-light !py-2.5 !px-5 shrink-0"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          <div>
            <p className="eyebrow text-gold-light mb-4">Explore</p>
            <ul className="space-y-2 text-sm text-ivory/80">
              <li><Link to="/categories" className="hover:text-gold-light transition-colors duration-150">Categories</Link></li>
              <li><Link to="/designs" className="hover:text-gold-light transition-colors duration-150">All Designs</Link></li>
              <li><Link to="/apply" className="hover:text-gold-light transition-colors duration-150">Apply for Classes</Link></li>
              <li><Link to="/about" className="hover:text-gold-light transition-colors duration-150">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-gold-light transition-colors duration-150">Contact</Link></li>
            </ul>
          </div>

          <div>
            <p className="eyebrow text-gold-light mb-4">Studio</p>
            <address className="not-italic text-sm text-ivory/80 leading-relaxed space-y-2">
              {STUDIO.addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p>Mon–Sat, 10:00 AM – 7:00 PM IST</p>
              <p>
                <a href={`tel:${STUDIO.phoneTel}`} className="hover:text-gold-light transition-colors duration-150">
                  {STUDIO.phoneDisplay}
                </a>
              </p>
              <p>
                <a href={`mailto:${STUDIO.email}`} className="hover:text-gold-light transition-colors duration-150 break-all">
                  {STUDIO.email}
                </a>
              </p>
            </address>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-ivory/15 flex flex-col md:flex-row gap-3 justify-between text-xs text-ivory/50">
          <p>&copy; {new Date().getFullYear()} {STUDIO.name}. All designs are digital files licensed for stitching, not resale.</p>
          <p>Personal and licensed commercial embroidery use only.</p>
        </div>
      </div>
    </footer>
  )
}
