import { useEffect, useRef } from 'react'

/**
 * Renders the form number onto a <canvas>.
 * html2canvas captures canvas pixels as-is, so this bypasses the known
 * html2canvas text-baseline bug (Tailwind `img { display:block }` corrupts
 * FontMetrics and shifts DOM text to the bottom of boxes).
 */
export default function FormNumberValue({
  value,
  width = 112,
  height = 44,
  fontSize = 28,
  className = '',
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = 2
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    // White fill
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Border
    ctx.strokeStyle = '#888888'
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1)

    // Centered number
    const text = value == null || value === '' ? '' : String(value)
    ctx.fillStyle = '#000000'
    ctx.font = `700 ${fontSize}px Arial, Helvetica, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, width / 2, height / 2)
  }, [value, width, height, fontSize])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={width}
      height={height}
      aria-label={value == null ? 'Form number' : `Form number ${value}`}
    />
  )
}
