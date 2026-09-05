import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";

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

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gold-light px-4 py-2.5 text-xs font-semibold tracking-wide text-ink transition-colors hover:bg-gold sm:px-6 sm:py-3 sm:text-sm";

const secondaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full border border-ivory/80 px-4 py-2.5 text-xs font-semibold tracking-wide text-ivory transition-colors hover:bg-ivory hover:text-maroon sm:px-6 sm:py-3 sm:text-sm";

function SlideCta({ linkUrl }) {
  if (!linkUrl) {
    return (
      <Link to="/designs" className={primaryBtn}>
        Browse all designs
      </Link>
    );
  }
  if (/^https?:\/\//i.test(linkUrl)) {
    return (
      <a
        href={linkUrl}
        className={primaryBtn}
        target="_blank"
        rel="noopener noreferrer"
      >
        Explore
      </a>
    );
  }
  return (
    <Link to={linkUrl} className={primaryBtn}>
      Explore
    </Link>
  );
}

/**
 * Overlay hero on every screen (bottom-left copy).
 * Desktop: 2.4:1 aspect (shorter band; upload still 2:1 with light crop).
 * Mobile: fixed height + compact type so the overlay layout doesn’t break.
 */
export const HERO_ASPECT = "2.4 / 1";
export const HERO_UPLOAD_SIZE = { width: 2400, height: 1200, label: "2:1" };
export const HERO_MEDIA_CLASS =
  "relative w-full overflow-hidden bg-ink h-[48vh] sm:h-[46vh] md:h-auto md:aspect-[2.4/1]";

export default function HeroCarousel({ slides }) {
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const slide = slides[index];

  useEffect(() => {
    if (count <= 1 || reducedMotion) return undefined;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 7000);
    return () => window.clearInterval(id);
  }, [count, reducedMotion, index]);

  return (
    <section
      className={`${HERO_MEDIA_CLASS} text-ivory`}
      aria-roledescription="carousel"
      aria-label="Featured highlights"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={slide.id}
          className="absolute inset-0"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.55 }}
        >
          <img
            src={slide.image_url}
            alt={slide.title || "Featured design"}
            width={HERO_UPLOAD_SIZE.width}
            height={HERO_UPLOAD_SIZE.height}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[center_30%] md:object-center"
          />
        </motion.div>
      </AnimatePresence>

      {/* Soft scrim — stronger at bottom-left where copy sits */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]
                   bg-gradient-to-t from-ink/80 via-ink/30 to-ink/10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1]
                   bg-gradient-to-r from-ink/55 via-ink/15 to-transparent"
        aria-hidden="true"
      />

      {/* Overlay stack: copy bottom-left, dots centered under it */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end">
        <div className="px-4 pb-3 pt-10 sm:px-6 sm:pb-4 md:px-10 md:pb-8 lg:px-14 lg:pb-9">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slide.id}
              className="max-w-xl text-left
                         [text-shadow:0_1px_2px_rgba(0,0,0,0.5),0_4px_20px_rgba(0,0,0,0.35)]"
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <p className="eyebrow text-[0.65rem] text-gold-light sm:text-xs">
                Om Design &amp; Classes
              </p>
              {slide.title ? (
                <h1 className="mt-1.5 text-xl leading-[1.15] text-ivory sm:mt-2 sm:text-2xl md:text-4xl lg:text-[2.5rem]">
                  {slide.title}
                </h1>
              ) : (
                <h1 className="mt-1.5 text-xl leading-[1.15] text-ivory sm:mt-2 sm:text-2xl md:text-4xl lg:text-[2.5rem]">
                  Embroidery designs,{" "}
                  <span className="italic text-gold-light">stitch-ready</span>{" "}
                  for your machine.
                </h1>
              )}
              {slide.subtitle ? (
                <p className="mt-2 max-w-md text-xs leading-relaxed text-ivory/90 line-clamp-2 sm:text-sm md:mt-3 md:line-clamp-none md:text-base">
                  {slide.subtitle}
                </p>
              ) : (
                <p className="mt-2 hidden max-w-md text-sm leading-relaxed text-ivory/90 sm:block md:mt-3 md:text-base">
                  Machine-ready DST, EMB, DHE and DHP — drawn and digitised in
                  Surat for clean, consistent stitch-outs.
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 sm:mt-5 sm:gap-3">
                <SlideCta linkUrl={slide.link_url} />
                <Link to="/categories" className={secondaryBtn}>
                  Explore categories
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {count > 1 && (
            <div
              className="mt-4 flex items-center justify-center gap-1.5 sm:mt-5 sm:gap-2 md:mt-6"
              aria-live="polite"
            >
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index
                      ? "w-6 bg-gold-light sm:w-8"
                      : "w-1.5 bg-ivory/45 hover:bg-ivory/75 sm:w-4"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Static fallback when no carousel slides are configured. */
export function StaticHomeHero() {
  return (
    <section
      className={`${HERO_MEDIA_CLASS} flex flex-col justify-end page-hero-gradient text-ivory`}
    >
      <div className="px-4 pb-8 pt-10 sm:px-6 md:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="max-w-xl text-left"
        >
          <p className="eyebrow text-gold-light">Om Design &amp; Classes</p>
          <h1 className="mt-2 text-xl leading-[1.15] text-ivory sm:text-2xl md:text-4xl lg:text-[2.5rem]">
            Embroidery designs,{" "}
            <span className="italic text-gold-light">stitch-ready</span> for
            your machine.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ivory/90">
            Drawn by hand in Surat, digitised as DST, EMB, DHE and DHP — so
            every border, booti and jaal stitches out exactly as it was drawn.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5 sm:gap-3">
            <Link to="/designs" className={primaryBtn}>
              Browse all designs
            </Link>
            <Link to="/categories" className={secondaryBtn}>
              Explore categories
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
