import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import ThreadDivider from "./ThreadDivider.jsx";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function SlideCta({ linkUrl }) {
  if (!linkUrl) {
    return (
      <Link to="/designs" className="btn-light">
        Browse all designs
      </Link>
    );
  }
  if (/^https?:\/\//i.test(linkUrl)) {
    return (
      <a
        href={linkUrl}
        className="btn-light"
        target="_blank"
        rel="noopener noreferrer"
      >
        Explore
      </a>
    );
  }
  return (
    <Link to={linkUrl} className="btn-light">
      Explore
    </Link>
  );
}

/**
 * Stacked homepage hero carousel — image row, then copy row on brand gradient.
 * When `slides` is empty, Home keeps StaticHomeHero instead.
 */
export default function HeroCarousel({ slides }) {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const slide = slides[index];

  useEffect(() => {
    if (count <= 1 || reducedMotion) return undefined;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 6000);
    return () => window.clearInterval(id);
  }, [count, reducedMotion, index]);

  const go = (next) => setIndex(((next % count) + count) % count);

  return (
    <section
      className="relative overflow-hidden bg-maroon-dark text-ivory"
      aria-roledescription="carousel"
      aria-label="Featured highlights"
    >
      <div className="flex flex-col">
        {/* Row 1 — full-width photo, no overlay */}
        <div className="relative w-full h-[90vh] overflow-hidden bg-ink">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slide.id}
              className="absolute inset-0"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.img
                src={slide.image_url}
                alt={slide.title || "Featured design"}
                className="absolute inset-0 w-full h-full object-cover object-center"
                initial={reducedMotion ? false : { scale: 1 }}
                animate={{ scale: reducedMotion ? 1 : 1.04 }}
                transition={{ duration: 8, ease: "linear" }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Gold accent between image and copy */}
          <div
            className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-gold-light/80 to-transparent"
            aria-hidden="true"
          />
        </div>

        {/* Row 2 — copy on solid brand panel */}
        <div className="relative page-hero-gradient">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            aria-hidden="true"
          >
            <ThreadDivider
              variant="wave"
              color="#C9A227"
              className="absolute top-[12%] left-0 h-14 w-full"
            />
            <ThreadDivider
              variant="stitch"
              color="#E0C368"
              className="absolute top-[36%] left-0 h-16 w-full"
            />
          </div>

          <div className="relative z-10 w-full max-w-3xl mx-auto px-6 py-12 sm:py-14 md:py-16 lg:py-20 text-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={slide.id}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <p className="eyebrow text-gold-light">
                  Om Design &amp; Classes
                </p>
                {slide.title ? (
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] mt-4 leading-[1.08] text-ivory">
                    {slide.title}
                  </h1>
                ) : (
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] mt-4 leading-[1.08] text-ivory">
                    Embroidery designs,{" "}
                    <span className="italic text-gold-light">stitch-ready</span>{" "}
                    for your machine.
                  </h1>
                )}
                {slide.subtitle && (
                  <p className="mt-5 text-base md:text-lg text-ivory/85 max-w-xl mx-auto leading-relaxed">
                    {slide.subtitle}
                  </p>
                )}
                <div className="mt-8 flex flex-wrap gap-4 justify-center">
                  <SlideCta linkUrl={slide.link_url} />
                  <Link to="/categories" className="btn-ghost-light">
                    Explore categories
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {count > 1 && (
              <div
                className="mt-10 flex items-center justify-center gap-3"
                aria-live="polite"
              >
                <button
                  type="button"
                  aria-label="Previous slide"
                  onClick={() => go(index - 1)}
                  className="w-9 h-9 rounded-full border border-ivory/30 text-ivory text-lg
                             hover:bg-ivory/10 transition-colors"
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
                        i === index
                          ? "w-7 bg-gold-light"
                          : "w-2 bg-ivory/40 hover:bg-ivory/70"
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  aria-label="Next slide"
                  onClick={() => go(index + 1)}
                  className="w-9 h-9 rounded-full border border-ivory/30 text-ivory text-lg
                             hover:bg-ivory/10 transition-colors"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Static fallback hero used when no carousel slides are configured. */
export function StaticHomeHero() {
  return (
    <section className="relative overflow-hidden text-ivory min-h-[78vh] flex items-center">
      <div className="absolute inset-0 page-hero-gradient" />
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        aria-hidden="true"
      >
        <ThreadDivider
          variant="wave"
          color="#C9A227"
          className="absolute top-[18%] left-0 h-16"
        />
        <ThreadDivider
          variant="stitch"
          color="#E0C368"
          className="absolute top-[42%] left-0 h-20"
        />
        <ThreadDivider
          variant="wave"
          color="#C9A227"
          className="absolute bottom-[16%] left-0 h-14"
        />
      </div>
      <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 w-full">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-2xl"
        >
          <p className="eyebrow text-gold-light">Digital embroidery designs</p>
          <h1 className="text-4xl md:text-6xl mt-5 leading-[1.08] text-ivory">
            Embroidery designs,{" "}
            <span className="italic text-gold-light">stitch-ready</span> for
            your machine.
          </h1>
          <p className="mt-6 text-base md:text-lg text-ivory/80 max-w-md leading-relaxed">
            Drawn by hand in Surat, digitised as DST, EMB, DHE and DHP — so
            every border, booti and jaal stitches out exactly as it was drawn.
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
  );
}
