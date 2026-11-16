import React from 'react';
import { AuthFunnelStep } from '../../types/models';

interface AuthFunnelChartProps {
  steps: AuthFunnelStep[];
}

const STEP_COLORS = [
  'bg-blue-700',
  'bg-blue-600',
  'bg-blue-500',
  'bg-blue-450',
  'bg-blue-400',
];

// Tailwind doesn't have bg-blue-450, use inline style for step 4
const STEP_HEX = [
  '#1d4ed8', // blue-700
  '#2563eb', // blue-600
  '#3b82f6', // blue-500
  '#60a5fa', // blue-400 (used for step 4 too, slightly lighter than 500)
  '#93c5fd', // blue-300 (step 5 lightest)
];

export const AuthFunnelChart: React.FC<AuthFunnelChartProps> = ({ steps }) => {
  if (steps.length === 0) {
    // Skeleton placeholder
    return (
      <div className="space-y-3 py-4 px-2 animate-pulse">
        {[100, 82, 65, 50, 38].map((w, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className="h-12 bg-slate-200 rounded"
              style={{ width: `${w}%` }}
            />
            {i < 4 && (
              <div className="h-3 w-16 bg-slate-100 rounded mt-1" />
            )}
          </div>
        ))}
      </div>
    );
  }

  const maxCount = steps[0]?.count || 1;

  return (
    <div className="flex flex-col items-center gap-0 py-2 select-none w-full">
      {steps.map((step, idx) => {
        // Width relative to step 1 (max), minimum 20% for visibility
        const widthPct = maxCount > 0
          ? Math.max(20, Math.round((step.count / maxCount) * 100))
          : 20;

        const isLast = idx === steps.length - 1;
        const color = STEP_HEX[idx] ?? STEP_HEX[STEP_HEX.length - 1];

        return (
          <React.Fragment key={step.step}>
            {/* Funnel bar */}
            <div
              className="flex items-center justify-between gap-3 px-5 py-3 rounded transition-all duration-300"
              style={{
                width: `${widthPct}%`,
                backgroundColor: color,
                minWidth: '220px',
              }}
            >
              {/* Left: step name + count */}
              <div className="flex flex-col min-w-0">
                <span className="text-white text-xs font-bold leading-tight truncate">
                  {step.stepName}
                </span>
                <span className="text-white/80 text-[11px] font-mono leading-tight">
                  {step.count.toLocaleString('vi-VN')} người
                </span>
              </div>
              {/* Right: retention % */}
              <div className="flex-shrink-0 text-right">
                <span className="text-white text-sm font-bold">
                  {step.retentionPct.toFixed(1)}%
                </span>
                <div className="text-white/70 text-[10px] leading-tight">giữ lại</div>
              </div>
            </div>

            {/* Drop indicator between steps */}
            {!isLast && step.dropPct > 0 && (
              <div className="flex items-center gap-1.5 py-1">
                <svg
                  className="w-3 h-3 text-red-400 flex-shrink-0"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <path d="M6 1v10M6 11l-3-3M6 11l3-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-red-500 text-[11px] font-semibold">
                  −{step.dropPct.toFixed(1)}% rời bỏ
                </span>
              </div>
            )}

            {/* Spacer between bars when no drop */}
            {!isLast && step.dropPct === 0 && (
              <div className="h-1" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
