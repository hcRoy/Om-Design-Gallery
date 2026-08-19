import { useState } from 'react'
import Section from '../components/Section.jsx'
import PageHero from '../components/PageHero.jsx'
import OwnersGrid from '../components/OwnersGrid.jsx'
import Seo from '../components/Seo.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { STUDIO } from '../data/studio.js'

const hours = [
  ['Monday – Friday', '10:00 AM – 7:00 PM'],
  ['Saturday', '10:00 AM – 7:00 PM'],
  ['Sunday', 'Closed'],
]

function GoldIcon({ children }) {
  return (
    <span className="w-9 h-9 rounded-full bg-gold/15 text-gold-dark inline-flex items-center justify-center shrink-0">
      {children}
    </span>
  )
}

/**
 * JUDGMENT CALL: this form currently just shows a local "sent"
 * confirmation — there's no `contact_messages` table in the schema you
 * gave me, and no email/backend endpoint specified. Flagging so you can
 * decide the real destination (a Supabase table + admin view, or a
 * direct email service) before this goes live; submitting right now
 * does not actually deliver the message anywhere.
 */
export default function Contact() {
  const { showToast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    setSent(true)
    showToast('Message sent — we\u2019ll be in touch shortly.', { type: 'success' })
  }

  return (
    <>
      <Seo
        title="Contact Us"
        description={`Get in touch with ${STUDIO.name} — ${STUDIO.addressLines[STUDIO.addressLines.length - 1]}, phone, and a form for designs, custom digitising or classes.`}
      />
      <PageHero eyebrow="Get in touch" title="We’d love to hear from you">
        <p>
          Questions about a file, custom digitising, studio licences or
          classes — send a note and we&rsquo;ll come back to you.
        </p>
      </PageHero>

      <Section tone="ivory">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-14 text-left items-start">
          <div className="bg-white rounded-lg shadow-card border border-ink/5 p-6 md:p-8">
            <h2 className="text-2xl mb-6">Send a message</h2>
            {sent ? (
              <div className="bg-sand rounded-md p-6">
                <p className="text-sm text-ink">
                  Thank you, {form.name || 'friend'} — your message has been
                  received. We&rsquo;ll get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-1.5">
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border border-ink/15 rounded-md px-4 py-2.5 text-sm
                               bg-white transition-colors duration-150
                               focus:outline-none focus:border-maroon"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border border-ink/15 rounded-md px-4 py-2.5 text-sm
                               bg-white transition-colors duration-150
                               focus:outline-none focus:border-maroon"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    value={form.message}
                    onChange={handleChange}
                    className="w-full border border-ink/15 rounded-md px-4 py-2.5 text-sm
                               bg-white resize-none transition-colors duration-150
                               focus:outline-none focus:border-maroon"
                  />
                </div>
                <button type="submit" className="btn-primary">
                  Send message
                </button>
              </form>
            )}
          </div>

          <div className="space-y-10">
            <div>
              <h2 className="text-2xl mb-5">Studio</h2>
              <ul className="space-y-4 text-sm text-ink-soft">
                <li className="flex gap-3 items-start">
                  <GoldIcon>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12z" />
                      <circle cx="12" cy="9" r="2.2" />
                    </svg>
                  </GoldIcon>
                  <address className="not-italic leading-relaxed">
                    {STUDIO.name}<br />
                    {STUDIO.addressLines.map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                    <a
                      href={STUDIO.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-maroon font-semibold"
                    >
                      Open in Maps
                    </a>
                  </address>
                </li>
                <li className="flex gap-3 items-center">
                  <GoldIcon>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </GoldIcon>
                  <a href={`tel:${STUDIO.phoneTel}`} className="text-maroon font-semibold">
                    {STUDIO.phoneDisplay}
                  </a>
                </li>
                <li className="flex gap-3 items-center">
                  <GoldIcon>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 7 9-7" />
                    </svg>
                  </GoldIcon>
                  <a href={`mailto:${STUDIO.email}`} className="text-maroon font-semibold break-all">
                    {STUDIO.email}
                  </a>
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-gold/40">
              <div className="flex items-center gap-3 mb-4">
                <GoldIcon>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </GoldIcon>
                <h2 className="text-2xl">Business hours</h2>
              </div>
              <ul className="text-sm text-ink-soft space-y-2">
                {hours.map(([day, time]) => (
                  <li key={day} className="flex justify-between max-w-sm border-b border-ink/10 pb-2">
                    <span>{day}</span>
                    <span className="font-semibold text-ink">{time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="aspect-video rounded-lg overflow-hidden bg-sand ring-1 ring-ink/10">
              <iframe
                title="Studio location on Google Maps"
                src={STUDIO.mapsEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </Section>

      <Section
        tone="sand"
        eyebrow="The studio"
        title="The people behind the files"
        subtitle="Four owners, one workshop in Varachha, Surat."
      >
        <OwnersGrid />
      </Section>
    </>
  )
}
