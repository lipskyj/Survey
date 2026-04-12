import React from 'react';
import { Users, School, BookOpen, TrendingUp } from 'lucide-react';
import StatCard from './StatCard';
import ScaleBar from './ScaleBar';
import DistBar from './DistBar';
import { Card, CardContent } from '@/components/ui/card';

export default function OverviewTab({ enrichedClasses, questionStats, allResponses }) {
  const totalResponses = allResponses.length;
  const totalClasses = enrichedClasses.length;
  const classesWithResponses = enrichedClasses.filter(c => c.responses && c.responses.length > 0).length;
  const allSchools = enrichedClasses.map(c => c.meta?.school).filter(Boolean);
  const schools = new Set(allSchools).size;
  const schoolsWithResponses = new Set(
    enrichedClasses.filter(c => c.responses && c.responses.length > 0).map(c => c.meta?.school).filter(Boolean)
  ).size;

  const overallAvg = questionStats.length
    ? (questionStats.filter(q => q.avg).reduce((s, q) => s + q.avg, 0) / questionStats.filter(q => q.avg).length)
    : null;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="סה״כ תגובות"
          value={totalResponses.toLocaleString()}
          color="text-green-600"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="כיתות עם לינק"
          value={totalClasses}
          sub={classesWithResponses > 0 ? `${classesWithResponses} הגיבו` : 'אין תגובות עדיין'}
          color="text-blue-600"
          icon={<BookOpen className="w-5 h-5" />}
        />
        <StatCard
          label="בתי ספר עם לינק"
          value={schools}
          sub={schoolsWithResponses > 0 ? `${schoolsWithResponses} הגיבו` : 'אין תגובות עדיין'}
          color="text-[#6B2D4A]"
          icon={<School className="w-5 h-5" />}
        />
        <StatCard
          label="ציון כולל ממוצע"
          value={overallAvg ? overallAvg.toFixed(1) : '—'}
          sub="מתוך 5"
          color="text-[#E85A24]"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Per-question overview */}
      <div>
        <h3 className="font-bold text-[#6B2D4A] mb-3">תוצאות לפי שאלה — כלל הנשאלים</h3>
        <div className="space-y-3">
          {questionStats.map((q) => (
            <Card key={q.questionId} className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-gray-800 flex-1">{q.label}</p>
                  <span className="text-xs text-gray-400 shrink-0">{q.n} תגובות</span>
                </div>

                {/* Scale questions */}
                {(q.questionType === 'scale_5' || q.questionType === 'scale_7' || q.questionType === 'bottom_line') && (
                  <div className="space-y-2">
                    <ScaleBar value={q.avg} max={q.max || 5} />
                    <DistBar dist={q.dist} total={q.n} max={q.max || 5} />
                  </div>
                )}

                {/* Multi / Single choice */}
                {(q.questionType === 'multi_choice' || q.questionType === 'single_choice') && (
                  <div className="space-y-1.5 mt-1">
                    {(q.choices || []).map(choice => {
                      const pct = q.n > 0 ? Math.round((choice.count / q.n) * 100) : 0;
                      return (
                        <div key={choice.label} className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-44 shrink-0 truncate text-right">{choice.label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-[#E85A24]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-left">{choice.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Open text */}
                {q.questionType === 'open_text' && (
                  <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
                    {(q.texts || []).slice(0, 10).map((t, i) => (
                      <p key={i} className="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">{t}</p>
                    ))}
                    {q.texts?.length > 10 && (
                      <p className="text-xs text-gray-400">ועוד {q.texts.length - 10} תגובות נוספות...</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {questionStats.length === 0 && (
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-8 text-center text-gray-400">אין נתונים עדיין</CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}