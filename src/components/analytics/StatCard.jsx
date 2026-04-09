import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function StatCard({ label, value, sub, color = 'text-[#6B2D4A]', icon }) {
  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardContent className="p-5 text-center">
        {icon && <div className="flex justify-center mb-2 text-gray-400">{icon}</div>}
        <div className={`text-3xl font-black ${color}`}>{value}</div>
        <div className="text-sm text-gray-600 mt-1">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}