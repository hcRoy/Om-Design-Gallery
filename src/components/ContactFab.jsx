import { STUDIO, getWhatsAppUrl } from "../data/studio.js";

/**
 * Persistent Call + WhatsApp dock for public pages.
 * Bottom-right FABs are the clearest pattern for customers who are
 * used to calling / WhatsApping local businesses (not hunting a Contact page).
 */
export default function ContactFab() {
  const whatsappHref = getWhatsAppUrl();

  return (
    <div
      className="fixed bottom-5 right-4 z-50 flex flex-col items-end gap-2.5
                 print:hidden sm:bottom-6 sm:right-5
                 pb-[env(safe-area-inset-bottom)]"
      role="group"
      aria-label="Quick contact"
    >
      <a
        href={`tel:${STUDIO.phoneTel}`}
        aria-label={`Call us at ${STUDIO.phoneDisplay}`}
        title="Call us"
        className="group relative flex h-12 w-12 items-center justify-center rounded-full
                   bg-maroon text-ivory shadow-md shadow-ink/25
                   transition-transform hover:scale-105 hover:bg-maroon-light
                   focus-visible:outline focus-visible:outline-2
                   focus-visible:outline-offset-2 focus-visible:outline-gold
                   active:scale-95 sm:h-[3.25rem] sm:w-[3.25rem]"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        <span
          className="pointer-events-none absolute right-full mr-2.5 hidden whitespace-nowrap
                     rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-ivory
                     opacity-0 shadow-sm transition-opacity group-hover:opacity-100
                     group-focus-visible:opacity-100 md:inline"
        >
          Call us
        </span>
      </a>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        title="WhatsApp us"
        className="group relative flex h-12 w-12 items-center justify-center rounded-full
                   bg-[#25D366] text-white shadow-md shadow-ink/25
                   transition-transform hover:scale-105 hover:brightness-105
                   focus-visible:outline focus-visible:outline-2
                   focus-visible:outline-offset-2 focus-visible:outline-gold
                   active:scale-95 sm:h-[3.25rem] sm:w-[3.25rem]"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
        <span
          className="pointer-events-none absolute right-full mr-2.5 hidden whitespace-nowrap
                     rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-ivory
                     opacity-0 shadow-sm transition-opacity group-hover:opacity-100
                     group-focus-visible:opacity-100 md:inline"
        >
          WhatsApp
        </span>
      </a>
    </div>
  );
}
