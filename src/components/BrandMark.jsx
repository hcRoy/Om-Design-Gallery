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
    compact: isStacked ? "w-10 h-10" : "w-11 h-11",
    nav: "w-12 h-12 md:w-14 md:h-14",
    lg: "w-[4.5rem] h-[4.5rem] md:w-20 md:h-20",
  }[logoSize];
  const px = { compact: isStacked ? 40 : 44, nav: 56, lg: 80 }[logoSize];

  return (
    <Tag
      {...linkProps}
      className={`flex min-w-0 max-w-full ${
        isStacked ? "flex-col items-start gap-2" : "items-center gap-2 sm:gap-2.5"
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
          className={`font-display ${
            compact
              ? "text-sm leading-snug"
              : "text-lg md:text-xl whitespace-nowrap"
          } ${isStacked ? "" : compact ? "truncate" : ""}`}
          title={compact && !isStacked ? STUDIO.name : undefined}
        >
          {STUDIO.name}
        </span>
        <span
          className={`text-[9px] md:text-[10px] tracking-widest2 uppercase mt-1 ${
            inverted ? "text-gold-light" : "text-ink-soft"
          }`}
        >
          {subtitle}
        </span>
      </span>
    </Tag>
  );
}
