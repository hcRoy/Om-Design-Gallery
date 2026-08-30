import { Link } from "react-router-dom";
import { LOGO_SRC, STUDIO } from "../data/studio.js";

export default function BrandMark({
  to = "/",
  inverted = false,
  onClick,
  compact = false,
  stacked = false,
  size,
  subtitle = "Embroidery Design",
}) {
  const Tag = to ? Link : "div";
  const linkProps = to ? { to, onClick } : {};
  const logoSize = compact ? "compact" : size === "lg" ? "lg" : "nav";
  const isStacked = compact && stacked;
  const logoClass = {
    compact: isStacked ? "w-9 h-9" : "w-10 h-10",
    nav: "w-11 h-11 md:w-12 md:h-12",
    lg: "w-[4.5rem] h-[4.5rem] md:w-20 md:h-20",
  }[logoSize];
  const px = { compact: isStacked ? 36 : 40, nav: 48, lg: 80 }[logoSize];

  const nameClass = isStacked
    ? "text-base leading-snug"
    : compact
      ? "text-base leading-tight"
      : "text-xl md:text-2xl leading-tight";

  return (
    <Tag
      {...linkProps}
      className={`flex min-w-0 max-w-full ${
        isStacked
          ? "flex-col items-start gap-1.5"
          : "items-center gap-2"
      } ${inverted ? "text-ivory" : "text-maroon"}`}
    >
      <img
        src={LOGO_SRC}
        alt=""
        width={px}
        height={px}
        className={`shrink-0 object-contain bg-transparent border-0 rounded-none ${logoClass}`}
      />
      <span className="flex flex-col leading-none min-w-0 max-w-full">
        <span
          className={`font-display font-semibold capitalize ${nameClass} ${
            isStacked ? "break-words" : compact ? "truncate" : "whitespace-nowrap"
          }`}
          title={compact && !isStacked ? STUDIO.name : undefined}
        >
          {STUDIO.name}
        </span>
        <span
          className={`text-[9px] md:text-[10px] tracking-widest2 uppercase mt-0.5 ${
            inverted ? "text-gold-light" : "text-ink-soft"
          }`}
        >
          {subtitle}
        </span>
      </span>
    </Tag>
  );
}
