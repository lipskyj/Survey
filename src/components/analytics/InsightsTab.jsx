import React, { useState } from 'react';
import { Sparkles, AlertTriangle, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function InsightsTab({ questionStats, bySchool, byGrade, totalResponses }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);

    const summary = {
      totalResponses,
      questions: questionStats.map(q => ({
        label: q.label,
        avg: q.avg?.toFixed(2),
        n: q.n,
        dist: q.dist,
      })),
      topSchools: [...bySchool]
        .sort((a, b) => (b.overallAvg ?? 0) - (a.overallAvg ?? 0))
        .slice(0, 5)
        .map(s => ({ name: s.key, avg: s.overallAvg?.toFixed(2), responses: s.responseCount })),
      bottomSchools: [...bySchool]
        .filter(s => s.overallAvg !== null && s.responseCount >= 5)
        .sort((a, b) => (a.overallAvg ?? 5) - (b.overallAvg ?? 5))
        .slice(0, 5)
        .map(s => ({ name: s.key, avg: s.overallAvg?.toFixed(2), responses: s.responseCount })),
      byGrade: byGrade.map(g => ({ grade: g.key, avg: g.overallAvg?.toFixed(2), responses: g.responseCount })),
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `אתה יועץ חינוכי. לפניך נתוני שאלון "מה נשמע?" — שאלון חזרה לשגרה לתלמידים ברשת עתיד.

נתונים:
${JSON.stringify(summary, null, 2)}

אנא כתוב ניתוח בעברית הכולל:
1. 3 תובנות מרכזיות חיוביות
2. 2-3 נקודות שדורשות תשומת לב / דאגה
3. 2 המלצות פעולה מעשיות
4. השוואה בין שכבות גיל (אם יש)
5. בתי ספר בולטים לטוב ולרע

כתוב בצורה ברורה, תמציתית, מקצועית. כל נקודה – משפט-שניים.`,
      response_json_schema: {
        type: 'object',
        properties: {
          positives: { type: 'array', items: { type: 'string' } },
          concerns: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          grade_comparison: { type: 'string' },
          school_highlights: { type: 'string' },
        }
      }
    });

    setInsights(result);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {!insights && !loading && (
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-10 h-10 text-[#E85A24] mx-auto mb-4" />
            <h3 className="font-bold text-[#6B2D4A] text-lg mb-2">תובנות AI</h3>
            <p className="text-gray-500 text-sm mb-6">
              ניתוח חכם של כלל הנתונים — דפוסים, בתי ספר בולטים, שכבות גיל ועוד
            </p>
            <Button
              onClick={generateInsights}
              disabled={!totalResponses}
              className="bg-[#E85A24] hover:bg-[#D14A1A]"
            >
              <Sparkles className="w-4 h-4 ml-2" />
              צור תובנות AI
            </Button>
            {!totalResponses && <p className="text-xs text-gray-400 mt-3">נדרשות תגובות לפני יצירת תובנות</p>}
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 text-[#E85A24] animate-spin mx-auto mb-3" />
            <p className="text-gray-500">מנתח {totalResponses.toLocaleString()} תגובות...</p>
          </CardContent>
        </Card>
      )}

      {insights && (
        <>
          <div>
            <h3 className="font-bold text-green-700 flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4" /> נקודות חיוביות
            </h3>
            <div className="space-y-2">
              {insights.positives?.map((p, i) => (
                <Card key={i} className="bg-green-50 border-0 shadow-sm">
                  <CardContent className="p-4 text-sm text-green-900">{p}</CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-amber-700 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" /> נקודות לתשומת לב
            </h3>
            <div className="space-y-2">
              {insights.concerns?.map((c, i) => (
                <Card key={i} className="bg-amber-50 border-0 shadow-sm">
                  <CardContent className="p-4 text-sm text-amber-900">{c}</CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-blue-700 flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4" /> המלצות פעולה
            </h3>
            <div className="space-y-2">
              {insights.recommendations?.map((r, i) => (
                <Card key={i} className="bg-blue-50 border-0 shadow-sm">
                  <CardContent className="p-4 text-sm text-blue-900">{r}</CardContent>
                </Card>
              ))}
            </div>
          </div>

          {insights.grade_comparison && (
            <Card className="bg-purple-50 border-0 shadow-sm">
              <CardContent className="p-4">
                <h4 className="font-bold text-[#6B2D4A] mb-2 text-sm">השוואה בין שכבות גיל</h4>
                <p className="text-sm text-purple-900">{insights.grade_comparison}</p>
              </CardContent>
            </Card>
          )}

          {insights.school_highlights && (
            <Card className="bg-orange-50 border-0 shadow-sm">
              <CardContent className="p-4">
                <h4 className="font-bold text-[#E85A24] mb-2 text-sm">בתי ספר בולטים</h4>
                <p className="text-sm text-orange-900">{insights.school_highlights}</p>
              </CardContent>
            </Card>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => { setInsights(null); }}
            className="w-full text-gray-500"
          >
            רענן תובנות
          </Button>
        </>
      )}
    </div>
  );
}