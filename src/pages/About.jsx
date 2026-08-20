import Section from '../components/Section.jsx'
import PageHero from '../components/PageHero.jsx'
import ThreadDivider from '../components/ThreadDivider.jsx'
import Seo from '../components/Seo.jsx'
import { Link } from 'react-router-dom'

const craftSteps = [
  {
    title: 'Drawn first',
    body: 'Every motif begins on paper or in the hoop — density and direction are decided by hand before a stitch path is written.',
  },
  {
    title: 'Tested on fabric',
    body: 'A design is only finished when silk, georgette or cotton says so. Pull, coverage and registration are checked on real cloth.',
  },
  {
    title: 'Digitised for the machine',
    body: 'DST, PES, EXP, JEF, EMB, DHE and DHP exports are tested on real machines, not just converted and shipped.',
  },
  {
    title: 'Documented for the workshop',
    body: 'Stitch counts and millimetre sizes ship with every file, so a design behaves the same on the shop floor as in the preview.',
  },
]

const missionPoints = [
  'Supported formats: DST, PES, EXP, JEF, EMB, DHE and DHP',
  'Stitch counts and sizes listed on every design',
  'Digitised from a teaching studio, not a template mill',
  'Built for saree, blouse, dupatta and yardage work',
]

export default function About() {
  return (
    <>
      <Seo
        title="About Us"
        description="Om Design & Classes began as a hand-embroidery teaching studio before it ever digitised a design — see how that shapes every file we release."
      />
      <PageHero
        eyebrow="Our story"
        title="Drawn by hand. Digitised for the machine."
        size="lg"
      >
        <p>
          Om Design &amp; Classes started as a hand-embroidery classroom in
          Surat. The design library grew out of what we taught, not the
          other way around.
        </p>
      </PageHero>

      <Section align="left" title="A workshop, not a template factory">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="aspect-[4/5] md:aspect-[4/3] rounded-lg overflow-hidden page-hero-gradient relative">
            <div className="absolute inset-0 flex flex-col justify-end p-8 text-ivory">
              <p className="eyebrow text-gold-light">The craft</p>
              <p className="font-display text-2xl mt-2">Hand first, then the hoop</p>
            </div>
          </div>
          <div>
            <p className="text-base text-ink-soft leading-relaxed">
              Om Design &amp; Classes began as a hand-embroidery teaching
              studio before machine digitisation ever entered the room. That
              order matters — every design still starts as a drawn motif,
              tested by hand, before it&rsquo;s translated into stitch paths.
            </p>
            <p className="text-base text-ink-soft leading-relaxed mt-4">
              What we digitise now is what we once taught by needle: borders
              that hold their density, bootis that sit true on silk, jaals
              that repeat without drifting.
            </p>
            <blockquote className="mt-8 pl-5 border-l-2 border-gold font-display text-xl text-ink leading-snug">
              A design file is only finished when the fabric says so.
            </blockquote>
          </div>
        </div>
      </Section>

      <Section
        tone="sand"
        eyebrow="How a file is finished"
        title="The standard we hold"
      >
        <ThreadDivider variant="wave" className="mb-14 max-w-md mx-auto" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {craftSteps.map((step) => (
            <article
              key={step.title}
              className="bg-white rounded-lg shadow-card border border-ink/5 p-6 text-left"
            >
              <h3 className="text-lg font-display">{step.title}</h3>
              <p className="text-sm text-ink-soft mt-2 leading-relaxed">{step.body}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section align="left" title="Our mission">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-base text-ink-soft leading-relaxed">
              To give workshops and home embroiderers files they can load
              with confidence — clean paths, honest formats, and notes that
              match what actually runs on the machine.
            </p>
            <ul className="mt-6 space-y-3">
              {missionPoints.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-ink">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/designs" className="btn-primary mt-8 inline-flex">
              Browse the catalogue
            </Link>
          </div>
          <div className="aspect-[4/3] rounded-lg overflow-hidden bg-sand relative">
            <div className="absolute inset-0 page-hero-gradient opacity-80" />
            <div className="relative h-full flex items-end p-8 text-ivory">
              <p className="font-display text-2xl leading-tight">
                Digitising, not just downloading.
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
