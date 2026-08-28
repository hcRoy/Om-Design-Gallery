import { useEffect, useRef, useState } from "react";

/**
 * Canvas signature pad — exports PNG data URL for Edge Function upload.
 */
export default function SignaturePad({
  onChange,
  clearLabel = "Clear",
  className = "",
}) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#1a1418";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const p = getPoint(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const p = getPoint(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (empty) {
      setEmpty(false);
      onChange?.(canvasRef.current.toDataURL("image/png"));
    }
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (!empty) onChange?.(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    setEmpty(true);
    onChange?.(null);
  };

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        className="w-full h-36 rounded-xl border border-ink/15 bg-white touch-none cursor-crosshair"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="flex justify-center items-center w-full">
        <button
          type="button"
          onClick={clear}
          className="mt-2 mb-2 text-xs font-semibold text-maroon hover:underline"
        >
          {clearLabel}
        </button>
      </div>
    </div>
  );
}
