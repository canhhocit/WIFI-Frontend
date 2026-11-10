import React from 'react';

interface GovernmentEmblemProps {
  size?: number | string;
  className?: string;
  title?: string;
}

/**
 * Authentic Vietnam National / Municipal Emblem SVG (Quốc huy / Huy hiệu Chính quyền)
 * Vector-rendered with faceted 3D golden star, heraldic rice ears, industrial cogwheel,
 * and crimson heraldic roundel.
 */
export const GovernmentEmblem: React.FC<GovernmentEmblemProps> = ({
  size = 40,
  className = '',
  title = 'Biểu trưng Chính quyền',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 select-none ${className}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        {/* Radial Crimson Background Gradient */}
        <radialGradient id="emblemCrimson" cx="42%" cy="38%" r="65%" fx="35%" fy="30%">
          <stop offset="0%" stopColor="#d32f2f" />
          <stop offset="55%" stopColor="#b71c1c" />
          <stop offset="100%" stopColor="#7f0000" />
        </radialGradient>

        {/* Metallic Gold Gradient for Outer Ring & Heraldry */}
        <linearGradient id="emblemGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe082" />
          <stop offset="35%" stopColor="#ffb300" />
          <stop offset="70%" stopColor="#ff8f00" />
          <stop offset="100%" stopColor="#ffc107" />
        </linearGradient>

        {/* Faceted Star Shading */}
        <linearGradient id="starLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff9c4" />
          <stop offset="100%" stopColor="#ffca28" />
        </linearGradient>
        <linearGradient id="starDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffa000" />
          <stop offset="100%" stopColor="#e65100" />
        </linearGradient>

        {/* Subtle Drop Shadow */}
        <filter id="emblemShadow" x="-10%" y="-10%" width="120%" height="125%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000" floodOpacity="0.4" />
        </filter>
        <filter id="starGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0.8" stdDeviation="0.8" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Outer Golden Border Rim */}
      <circle cx="50" cy="50" r="48" fill="url(#emblemGold)" filter="url(#emblemShadow)" />
      <circle cx="50" cy="50" r="45" fill="#5c0000" />

      {/* Main Crimson Disc Field */}
      <circle cx="50" cy="50" r="44" fill="url(#emblemCrimson)" />

      {/* Concentric Golden Beaded Ring */}
      <circle
        cx="50"
        cy="50"
        r="42.5"
        fill="none"
        stroke="#ffd54f"
        strokeWidth="0.75"
        strokeDasharray="2 1.2"
        opacity="0.85"
      />

      {/* ================= LEFT RICE EARS (Bông lúa bên trái) ================= */}
      <g fill="url(#emblemGold)" stroke="#d79a00" strokeWidth="0.3">
        {/* Arching stems */}
        <path d="M 26 75 C 20 62, 21 44, 30 28" fill="none" stroke="url(#emblemGold)" strokeWidth="1.2" strokeLinecap="round" />
        {/* Grain clusters along left side */}
        <ellipse cx="21" cy="65" rx="3.5" ry="2" transform="rotate(-30 21 65)" />
        <ellipse cx="19" cy="57" rx="3.5" ry="2" transform="rotate(-20 19 57)" />
        <ellipse cx="19" cy="49" rx="3.5" ry="2" transform="rotate(-10 19 49)" />
        <ellipse cx="21" cy="41" rx="3.5" ry="2" transform="rotate(5 21 41)" />
        <ellipse cx="25" cy="34" rx="3.5" ry="2" transform="rotate(25 25 34)" />
        <ellipse cx="30" cy="28" rx="3.2" ry="1.8" transform="rotate(45 30 28)" />
      </g>

      {/* ================= RIGHT RICE EARS (Bông lúa bên phải) ================= */}
      <g fill="url(#emblemGold)" stroke="#d79a00" strokeWidth="0.3">
        {/* Arching stems */}
        <path d="M 74 75 C 80 62, 79 44, 70 28" fill="none" stroke="url(#emblemGold)" strokeWidth="1.2" strokeLinecap="round" />
        {/* Grain clusters along right side */}
        <ellipse cx="79" cy="65" rx="3.5" ry="2" transform="rotate(30 79 65)" />
        <ellipse cx="81" cy="57" rx="3.5" ry="2" transform="rotate(20 81 57)" />
        <ellipse cx="81" cy="49" rx="3.5" ry="2" transform="rotate(10 81 49)" />
        <ellipse cx="79" cy="41" rx="3.5" ry="2" transform="rotate(-5 79 41)" />
        <ellipse cx="75" cy="34" rx="3.5" ry="2" transform="rotate(-25 75 34)" />
        <ellipse cx="70" cy="28" rx="3.2" ry="1.8" transform="rotate(-45 70 28)" />
      </g>

      {/* ================= INDUSTRIAL COGWHEEL (Bánh răng công nghiệp) ================= */}
      <g transform="translate(50, 77)" fill="url(#emblemGold)" stroke="#b26a00" strokeWidth="0.4">
        {/* Cogwheel base arc */}
        <path d="M -16 0 A 16 16 0 0 1 16 0 L 12 5 A 12 12 0 0 0 -12 5 Z" />
        {/* Gear teeth */}
        <rect x="-17" y="-2" width="3" height="3" rx="0.5" transform="rotate(-50 -17 -2)" />
        <rect x="-12" y="-9" width="3" height="3" rx="0.5" transform="rotate(-25 -12 -9)" />
        <rect x="-1.5" y="-17" width="3" height="3" rx="0.5" />
        <rect x="9" y="-9" width="3" height="3" rx="0.5" transform="rotate(25 9 -9)" />
        <rect x="14" y="-2" width="3" height="3" rx="0.5" transform="rotate(50 14 -2)" />
      </g>

      {/* ================= RED RIBBON / BANNER AT BASE (Dải lụa đỏ) ================= */}
      <g transform="translate(50, 84)">
        {/* Ribbon path */}
        <path
          d="M -24 -2 Q 0 5, 24 -2 Q 22 7, 18 10 Q 0 6, -18 10 Q -22 7, -24 -2 Z"
          fill="#c62828"
          stroke="url(#emblemGold)"
          strokeWidth="0.8"
        />
        {/* Inner gold fold lines */}
        <path d="M -12 2 Q 0 7, 12 2" fill="none" stroke="#ffe082" strokeWidth="0.6" opacity="0.8" />
      </g>

      {/* ================= 3D FACETED GOLDEN STAR (Ngôi sao vàng 5 cánh) ================= */}
      <g filter="url(#starGlow)">
        {/* Top point: (50, 23), Inner-R: (54.7, 37.5), Inner-L: (45.3, 37.5) */}
        <polygon points="50,44 50,23 54.7,37.5" fill="url(#starLight)" />
        <polygon points="50,44 50,23 45.3,37.5" fill="url(#starDark)" />

        {/* Right point: (70, 37.5), Inner-Top: (54.7, 37.5), Inner-Bottom: (57.6, 46.5) */}
        <polygon points="50,44 70,37.5 57.6,46.5" fill="url(#starLight)" />
        <polygon points="50,44 70,37.5 54.7,37.5" fill="url(#starDark)" />

        {/* Bottom-right point: (62.3, 61), Inner-R: (57.6, 46.5), Inner-Bottom: (50, 52) */}
        <polygon points="50,44 62.3,61 50,52" fill="url(#starLight)" />
        <polygon points="50,44 62.3,61 57.6,46.5" fill="url(#starDark)" />

        {/* Bottom-left point: (37.7, 61), Inner-Bottom: (50, 52), Inner-L: (42.4, 46.5) */}
        <polygon points="50,44 37.7,61 42.4,46.5" fill="url(#starLight)" />
        <polygon points="50,44 37.7,61 50,52" fill="url(#starDark)" />

        {/* Left point: (30, 37.5), Inner-Bottom: (42.4, 46.5), Inner-Top: (45.3, 37.5) */}
        <polygon points="50,44 30,37.5 45.3,37.5" fill="url(#starLight)" />
        <polygon points="50,44 30,37.5 42.4,46.5" fill="url(#starDark)" />
      </g>
    </svg>
  );
};
