import React from 'react';

interface VietnamFlagProps {
  width?: number | string;
  height?: number | string;
  variant?: 'flag' | 'circle' | 'square';
  className?: string;
  animate?: boolean;
  title?: string;
}

/**
 * Authentic National Flag of Vietnam (Cờ đỏ sao vàng)
 * Accurate standard 3:2 ratio, official red (#DA251D) and golden yellow 5-pointed star (#FFFF00).
 * Supports standard flag, circular avatar, rounded square, and glowing pulse loading effect.
 */
export const VietnamFlag: React.FC<VietnamFlagProps> = ({
  width = 36,
  height = 24,
  variant = 'flag',
  className = '',
  animate = false,
  title = 'Quốc kỳ Việt Nam (Cờ đỏ sao vàng)',
}) => {
  const isCircle = variant === 'circle';
  const isSquare = variant === 'square';

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none overflow-hidden ${
        isCircle ? 'rounded-full aspect-square' : isSquare ? 'rounded-md aspect-square' : 'rounded-xs aspect-[3/2]'
      } border border-amber-400/50 shadow-xs ${className}`}
      style={{
        width,
        height: isCircle || isSquare ? width : height,
      }}
      role="img"
      aria-label={title}
      title={title}
    >
      {variant === 'flag' ? (
        <svg
          viewBox="0 0 300 200"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full h-full"
        >
          {/* Official Flag Red Field (#DA251D) */}
          <rect width="300" height="200" fill="#DA251D" />

          {/* Official 5-Pointed Golden Star (#FFFF00) */}
          <polygon
            points="150,40 163.47,81.46 207.06,81.46 171.80,107.08 185.27,148.54 150,122.92 114.73,148.54 128.20,107.08 92.94,81.46 136.53,81.46"
            fill="#FFFF00"
          />
        </svg>
      ) : (
        <svg
          viewBox="0 0 200 200"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full h-full"
        >
          {isCircle ? (
            <circle cx="100" cy="100" r="100" fill="#DA251D" />
          ) : (
            <rect width="200" height="200" rx="20" fill="#DA251D" />
          )}
          <polygon
            points="100,40 113.47,81.46 157.06,81.46 121.80,107.08 135.27,148.54 100,122.92 64.73,148.54 78.20,107.08 42.94,81.46 86.53,81.46"
            fill="#FFFF00"
          />
        </svg>
      )}

      {/* Loading Radar Aura Effect */}
      {animate && (
        <>
          <span className="absolute inset-0 ring-2 ring-yellow-300 animate-ping opacity-60 pointer-events-none rounded-inherit" />
          <span className="absolute inset-0 bg-yellow-400/20 animate-pulse pointer-events-none" />
        </>
      )}
    </div>
  );
};
