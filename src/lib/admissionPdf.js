import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

function waitForImages(root) {
  const imgs = root.querySelectorAll('img')
  return Promise.all(
    [...imgs].map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve()
            return
          }
          img.onload = () => resolve()
          img.onerror = () => resolve()
        }),
    ),
  )
}

async function waitForFonts() {
  try {
    if (document.fonts?.ready) await document.fonts.ready
  } catch {
    // ignore — older browsers
  }
}

/**
 * Capture each A4 `.page` separately, then merge into a 2-page PDF.
 * Higher scale + PNG keeps serif header text sharp (JPEG softens edges).
 */
export async function downloadAdmissionPdf(element, filename) {
  if (!element) throw new Error('Nothing to export')

  await waitForFonts()
  await waitForImages(element)

  // Briefly place export on-screen so the browser paints fonts at full quality.
  // Off-screen (-10000px) captures often produce soft / clumsy text.
  const host = element.closest('.admission-pdf-export')
  const prev = host
    ? {
        left: host.style.left,
        top: host.style.top,
        opacity: host.style.opacity,
        zIndex: host.style.zIndex,
        pointerEvents: host.style.pointerEvents,
      }
    : null

  if (host) {
    host.style.left = '0'
    host.style.top = '0'
    host.style.opacity = '0'
    host.style.zIndex = '-1'
    host.style.pointerEvents = 'none'
  }

  // Let layout paint before capture
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

  try {
    const pages = [...element.querySelectorAll('.page')]
    if (pages.length === 0) throw new Error('No pages to export')

    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
    })

    const pageW = 210
    const pageH = 297
    // ~3× CSS pixels ≈ sharp print text without huge files
    const scale = Math.min(3, Math.max(2.5, (window.devicePixelRatio || 1) * 2))

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const canvas = await html2canvas(page, {
        scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        width: page.offsetWidth,
        height: page.offsetHeight,
        windowWidth: page.offsetWidth,
        windowHeight: page.offsetHeight,
        onclone(doc) {
          const cloneRoot = doc.querySelector('.admission-print-root')
          if (!cloneRoot) return
          cloneRoot.style.webkitFontSmoothing = 'antialiased'
          cloneRoot.style.mozOsxFontSmoothing = 'grayscale'
          cloneRoot.style.textRendering = 'geometricPrecision'
          // Prevent subpixel blur on large header type
          cloneRoot.querySelectorAll('.company-name, .student-copy-company-name').forEach((el) => {
            el.style.transform = 'translateZ(0)'
            el.style.backfaceVisibility = 'hidden'
          })
        },
      })

      // PNG keeps crisp glyph edges; JPEG makes serif headers look "clumsy"
      const imgData = canvas.toDataURL('image/png')
      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH, undefined, 'MEDIUM')
    }

    pdf.save(filename || 'admission.pdf')
  } finally {
    if (host && prev) {
      host.style.left = prev.left
      host.style.top = prev.top
      host.style.opacity = prev.opacity
      host.style.zIndex = prev.zIndex
      host.style.pointerEvents = prev.pointerEvents
    }
  }
}

export function admissionPdfFilename(admission) {
  const num = admission?.form_number ?? admission?.id?.slice(0, 8) ?? 'form'
  const name = String(admission?.student_name ?? 'student')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
  return `admission-${num}-${name || 'student'}.pdf`
}
