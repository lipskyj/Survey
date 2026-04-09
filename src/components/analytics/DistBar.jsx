import React from 'react';

// Horizontal stacked distribution bar for scale answers
const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e'];

export default function DistBar({ dist, total }) {
  if (!total) return <span className="text-xs text-gray-400">אין נתונים</span>;
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
              style={{ width: `${pct}%`, background: COLORS[v - 1] }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">1</span>
        <span className="text-xs text-gray-400">5</span>
      </div>
    </div>
  );
}