import React from 'react';

interface ViettelLogoProps {
  size?: number | string;
  height?: number | string;
  variant?: 'full' | 'badge' | 'text' | 'simple';
  color?: 'red' | 'white' | 'dark';
  className?: string;
  showTagline?: boolean;
}

/**
 * Official Viettel Visual Brand Identity Logo
 * Colors: Primary Viettel Red (#EE0033), Deep Red (#C4002B)
 * Taglines: "Theo cách của bạn" | "Cùng bạn bứt phá"
 */
export const ViettelLogo: React.FC<ViettelLogoProps> = ({
  height = 32,
  variant = 'full',
  color = 'red',
  className = '',
  showTagline = true,
}) => {
  const isWhite = color === 'white';
  const textColor = isWhite ? '#FFFFFF' : '#EE0033';
  const subColor = isWhite ? '#FEE2E2' : '#64748B';

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full shadow-sm select-none ${
          isWhite
            ? 'bg-white/15 text-white backdrop-blur-md border border-white/25'
            : 'bg-gradient-to-r from-[#EE0033] to-[#C4002B] text-white shadow-red-500/25'
        } ${className}`}
      >
        <span className="font-black text-xs tracking-tight font-sans">viettel</span>
        <span className="h-3 w-px bg-white/40" />
        <span className="text-[10px] font-semibold tracking-wide uppercase opacity-95">
          Hải Phòng Telecom
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        height={height}
        viewBox="0 0 160 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto max-w-full drop-shadow-xs"
        role="img"
        aria-label="Viettel"
      >
        <defs>
          <linearGradient id="viettelRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EE0033" />
            <stop offset="100%" stopColor="#C4002B" />
          </linearGradient>
        </defs>

        {/* Viettel stylized modern wordmark */}
        <g fill={textColor}>
          {/* v */}
          <path d="M12 14.5L19.2 33.2H25.8L33 14.5H27.2L22.5 27.6L17.8 14.5H12Z" />

          {/* i */}
          <path d="M37.5 10C36.1 10 35 11.1 35 12.5C35 13.9 36.1 15 37.5 15C38.9 15 40 13.9 40 12.5C40 11.1 38.9 10 37.5 10ZM35.3 17.5H39.7V33.2H35.3V17.5Z" />

          {/* e */}
          <path d="M51.8 17C46.8 17 43 20.6 43 25.5C43 30.3 46.7 34 52 34C55.4 34 58.2 32.5 59.8 29.8L56.2 27.4C55.3 28.9 53.8 29.8 52 29.8C49.3 29.8 47.5 28 47.4 25.6H60.4C60.5 25.1 60.5 24.6 60.5 24C60.5 19.8 57 17 51.8 17ZM47.4 22.8C47.8 20.7 49.5 19.3 51.8 19.3C54.1 19.3 55.8 20.7 56.1 22.8H47.4Z" />

          {/* t */}
          <path d="M68.5 13V17.5H73V21.5H68.5V28.2C68.5 29.4 69.1 29.9 70.3 29.9C71.2 29.9 72.1 29.6 72.8 29.2L73.5 33C72.3 33.7 70.6 34 68.8 34C65.5 34 64.1 32.2 64.1 28.5V21.5H60.8V17.5H64.1V13H68.5Z" />

          {/* t */}
          <path d="M81.5 13V17.5H86V21.5H81.5V28.2C81.5 29.4 82.1 29.9 83.3 29.9C84.2 29.9 85.1 29.6 85.8 29.2L86.5 33C85.3 33.7 83.6 34 81.8 34C78.5 34 77.1 32.2 77.1 28.5V21.5H73.8V17.5H77.1V13H81.5Z" />

          {/* e */}
          <path d="M97.8 17C92.8 17 89 20.6 89 25.5C89 30.3 92.7 34 98 34C101.4 34 104.2 32.5 105.8 29.8L102.2 27.4C101.3 28.9 99.8 29.8 98 29.8C95.3 29.8 93.5 28 93.4 25.6H106.4C106.5 25.1 106.5 24.6 106.5 24C106.5 19.8 103 17 97.8 17ZM93.4 22.8C93.8 20.7 95.5 19.3 97.8 19.3C100.1 19.3 101.8 20.7 102.1 22.8H93.4Z" />

          {/* l */}
          <path d="M110 9H114.4V33.2H110V9Z" />
        </g>

        {/* Tagline "Theo cách của bạn" if full */}
        {showTagline && variant === 'full' && (
          <text
            x="16"
            y="43"
            fill={subColor}
            fontSize="8.5"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="500"
            letterSpacing="0.4"
          >
            Theo cách của bạn
          </text>
        )}
      </svg>
    </div>
  );
};
