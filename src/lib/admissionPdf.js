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

/** Wait until Aadhaar canvas slots have finished contain-fit painting. */
function waitForAadhaarCanvases(root, timeoutMs = 4000) {
  const canvases = [...root.querySelectorAll('.aadhaar-fit-canvas')]
  if (canvases.length === 0) return Promise.resolve()

  return new Promise((resolve) => {
    const started = Date.now()

    const check = () => {
      const ready = canvases.every(
        (c) => c.dataset.aadhaarReady === '1' && c.width > 0 && c.height > 0,
      )
      if (ready || Date.now() - started > timeoutMs) {
        resolve()
        return
      }
      requestAnimationFrame(check)
    }

    check()
  })
}

async function waitForFonts() {
  try {
    if (document.fonts?.ready) await document.fonts.ready
  } catch {
    // ignore — older browsers
  }
}

/**
 * Tailwind Preflight sets `img { display: block }`, which breaks html2canvas
 * FontMetrics baseline measurement (it uses a temporary <img>). Result: DOM
 * text is painted too low. Temporarily force inline-block during capture.
 */
function withHtml2CanvasBaselineFix(run) {
  const style = document.createElement('style')
  style.setAttribute('data-admission-h2c-fix', '1')
  style.textContent = 'img { display: inline-block !important; }'
  document.head.appendChild(style)
  return Promise.resolve()
    .then(run)
    .finally(() => {
      style.remove()
    })
}

/**
 * Capture each A4 `.page` separately, then merge into a 2-page PDF.
 */
export async function downloadAdmissionPdf(element, filename) {
  if (!element) throw new Error('Nothing to export')

  await waitForFonts()
  await waitForImages(element)
  await waitForAadhaarCanvases(element)

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

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

  try {
    await withHtml2CanvasBaselineFix(async () => {
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

            // Same baseline fix inside the cloned document
            const fix = doc.createElement('style')
            fix.textContent = 'img { display: inline-block !important; }'
            doc.head.appendChild(fix)

            cloneRoot.querySelectorAll('.company-name').forEach((el) => {
              el.style.transform = 'translateZ(0)'
              el.style.backfaceVisibility = 'hidden'
            })
          },
        })

        const imgData = canvas.toDataURL('image/png')
        if (i > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, 0, pageW, pageH, undefined, 'MEDIUM')
      }

      pdf.save(filename || 'admission.pdf')
    })
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
