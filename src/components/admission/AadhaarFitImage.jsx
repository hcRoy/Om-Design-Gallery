import { useEffect, useRef } from 'react'

/**
 * Draws an image onto a canvas with "object-fit: contain" math.
 * html2canvas often ignores CSS object-fit and stretches <img> to the box —
 * canvas pixels are captured as-is, so aspect ratio stays correct in PDF.
 */
export default function AadhaarFitImage({ src, alt = '' }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas || !src) return

    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'

    const paint = () => {
      if (cancelled) return
      const w = Math.max(1, Math.floor(wrap.clientWidth))
      const h = Math.max(1, Math.floor(wrap.clientHeight))
      if (!img.naturalWidth || !img.naturalHeight) return

      const dpr = Math.min(2.5, Math.max(2, window.devicePixelRatio || 1))
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      canvas.dataset.aadhaarReady = '1'

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)

      const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight)
      const dw = img.naturalWidth * scale
      const dh = img.naturalHeight * scale
      const dx = (w - dw) / 2
      const dy = (h - dh) / 2
      ctx.drawImage(img, dx, dy, dw, dh)
    }

    img.onload = paint
    img.onerror = () => {
      if (canvas) canvas.dataset.aadhaarReady = '0'
    }
    img.src = src

    const ro = new ResizeObserver(() => {
      if (img.complete && img.naturalWidth > 0) paint()
    })
    ro.observe(wrap)

    // Layout may settle after first paint (off-screen PDF host).
    requestAnimationFrame(() => requestAnimationFrame(paint))

    return () => {
      cancelled = true
      ro.disconnect()
    }
  }, [src])

  return (
    <div ref={wrapRef} className="aadhaar-fit-wrap">
      <canvas
        ref={canvasRef}
        className="aadhaar-fit-canvas"
        aria-label={alt}
        data-aadhaar-ready="0"
      />
    </div>
  )
}
