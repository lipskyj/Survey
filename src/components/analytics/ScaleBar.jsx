import React from 'react';

export default function ScaleBar({ value, max = 5, showLabel = true }) {
  const pct = value != null ? (value / max) * 100 : 0;
  const color = pct >= 70 ? 'bg-green-500' : pct >= 45 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className="text-sm font-bold w-8 text-left tabular-nums">
          {value != null ? value.toFixed(1) : '—'}
        </span>
      )}
    </div>
  );
}