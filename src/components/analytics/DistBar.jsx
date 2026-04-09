import React from 'react';

// Horizontal stacked distribution bar for scale answers (supports 5 or 7 point scale)
const COLORS5 = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'];
const COLORS7 = ['#ef4444', '#f97316', '#fbbf24', '#facc15', '#a3e635', '#4ade80', '#22c55e'];
const COLORS = (max) => max === 7 ? COLORS7 : COLORS5;

export default function DistBar({ dist, total, max = 5 }) {
  if (!total) return <span className="text-xs text-gray-400">אין נתונים</span>;
  const colors = COLORS(max);
  return (
    <div className="w-full">
      <div className="flex h-4 rounded-full overflow-hidden gap-px">
        {dist.map(({ v, count }) => {
          const pct = (count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={v}
              title={`${v}: ${count} תגובות (${pct.toFixed(0)}%)`}
              style={{ width: `${pct}%`, background: colors[v - 1] }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">1</span>
        <span className="text-xs text-gray-400">{max}</span>
      </div>
    </div>
  );
}