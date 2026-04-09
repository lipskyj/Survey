import React, { useState } from 'react';
import { School, ChevronDown, ChevronUp } from 'lucide-react';
import ScaleBar from './ScaleBar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GRADE_LEVELS } from '@/lib/schoolsList';

function SchoolRow({ item, scaleQuestions }) {
  const [expanded, setExpanded] = useState(false);
  const pct = item.overallAvg ? (item.overallAvg / 5) * 100 : 0;
  const color = pct >= 70 ? 'bg-green-100 text-green-700' : pct >= 45 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600';

  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardContent className="p-4">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
            <School className="w-4 h-4 text-[#E85A24]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-800 text-sm truncate">{item.key}</p>
            <div className="flex gap-2 mt-0.5">
              <span className="text-xs text-gray-400">{item.classCount} כיתות</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400">{item.responseCount} תגובות</span>
            </div>
          </div>
          <Badge className={`${color} border-0 text-xs shrink-0`}>
            {item.overallAvg ? item.overallAvg.toFixed(1) : '—'}
          </Badge>
          <div className="w-24 hidden sm:block">
            <ScaleBar value={item.overallAvg} showLabel={false} />
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
            {item.qAvgs.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-48 shrink-0 truncate">{q.label}</span>
                <div className="flex-1">
                  <ScaleBar value={q.avg} max={q.max || 5} />
                </div>
                <span className="text-xs text-gray-400 w-12 text-left">{q.n} מענ׳</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SchoolTab({ bySchool, scaleQuestions }) {
  const sorted = [...bySchool].sort((a, b) => (b.overallAvg ?? 0) - (a.overallAvg ?? 0));

  if (sorted.length === 0) {
    return (
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-8 text-center text-gray-400">אין נתונים עדיין</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 mb-2">לחץ על שורה לפירוט לפי שאלה</p>
      {sorted.map(item => (
        <SchoolRow key={item.key} item={item} scaleQuestions={scaleQuestions} />
      ))}
    </div>
  );
}