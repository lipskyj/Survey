import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ScaleBar from './ScaleBar';
import DistBar from './DistBar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GRADE_LEVELS } from '@/lib/schoolsList';
import { computeQuestionStats, getAnswerValues, avg } from '@/lib/analyticsHelpers';

function GradeCard({ item, scaleQuestions, responsesForGrade }) {
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
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
            <span className="font-black text-[#6B2D4A] text-sm">{item.key}׳</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">{item.responseCount.toLocaleString()} תגובות</p>
            <p className="text-xs text-gray-400">{item.classCount} כיתות</p>
          </div>
          <Badge className={`${color} border-0 text-sm font-bold`}>
            {item.overallAvg ? item.overallAvg.toFixed(1) : '—'}
          </Badge>
          <div className="w-24 hidden sm:block">
            <ScaleBar value={item.overallAvg} showLabel={false} />
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-50 space-y-4">
            {item.qAvgs.map((q, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{q.label}</span>
                  <span className="text-xs text-gray-400">{q.n} תגובות</span>
                </div>
                <ScaleBar value={q.avg} max={q.max || 5} />
                {scaleQuestions[i] && (
                  <div className="mt-1">
                    <DistBar
                      dist={Array.from({ length: q.max || 5 }, (_, idx) => idx + 1).map(v => ({
                        v,
                        count: responsesForGrade
                          .flatMap(r => r.answers || [])
                          .filter(a => a.question_id === scaleQuestions[i].id)
                          .filter(a => (parseFloat(a.value) || a.numeric_value) === v)
                          .length
                      }))}
                      total={q.n}
                      max={q.max || 5}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function GradeTab({ byGrade, scaleQuestions, enrichedClasses }) {
  // Sort by grade order
  const sorted = [...byGrade].sort((a, b) => GRADE_LEVELS.indexOf(a.key) - GRADE_LEVELS.indexOf(b.key));

  if (sorted.length === 0) {
    return (
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-8 text-center text-gray-400">אין נתונים עדיין</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 mb-2">לחץ על שכבה לפירוט לפי שאלה עם התפלגות</p>
      {sorted.map(item => {
        const responsesForGrade = enrichedClasses
          .filter(c => c.meta?.grade === item.key)
          .flatMap(c => c.responses);
        return (
          <GradeCard
            key={item.key}
            item={item}
            scaleQuestions={scaleQuestions}
            responsesForGrade={responsesForGrade}
          />
        );
      })}
    </div>
  );
}