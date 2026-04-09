import React from 'react';
import { Users, School, BookOpen, TrendingUp } from 'lucide-react';
import StatCard from './StatCard';
import ScaleBar from './ScaleBar';
import DistBar from './DistBar';
import { Card, CardContent } from '@/components/ui/card';

export default function OverviewTab({ enrichedClasses, questionStats, allResponses }) {
  const totalResponses = allResponses.length;
  const totalClasses = enrichedClasses.length;
  const schools = new Set(enrichedClasses.map(c => c.meta?.school).filter(Boolean)).size;
  const grades = new Set(enrichedClasses.map(c => c.meta?.grade).filter(Boolean)).size;

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
          label="כיתות משתתפות"
          value={totalClasses}
          color="text-blue-600"
          icon={<BookOpen className="w-5 h-5" />}
        />
        <StatCard
          label="בתי ספר"
          value={schools}
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
        <h3 className="font-bold text-[#6B2D4A] mb-3">ממוצע לפי שאלה — כלל הנשאלים</h3>
        <div className="space-y-3">
          {questionStats.map((q, i) => (
            <Card key={q.questionId} className="bg-white border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-gray-800 flex-1">{q.label}</p>
                  <span className="text-xs text-gray-400 shrink-0">{q.n} תגובות</span>
                </div>
                <div className="space-y-2">
                  <ScaleBar value={q.avg} max={q.max || 5} />
                  <DistBar dist={q.dist} total={q.n} max={q.max || 5} />
                </div>
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