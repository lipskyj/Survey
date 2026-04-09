import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronRight, School, Users, BarChart2, Filter, X } from 'lucide-react';
import { SCHOOLS_LIST, GRADE_LEVELS } from '@/lib/schoolsList';

const SCALE_QUESTIONS_LABELS = {
  0: 'שמחה לחזור',
  1: 'חשיבות סיום שנה',
  2: 'אמונה ביכולת',
  3: 'הבנת הציפיות',
  4: 'מבוגר תומך',
  5: 'לחץ / מצוקה',
};

function parseClassMeta(survey) {
  const desc = survey.activity_description || '';
  const metaMatch = desc.match(/__meta:(.+)$/);
  if (metaMatch) {
    try { return JSON.parse(metaMatch[1]); } catch {}
  }
  return null;
}

function isClassSurvey(survey) {
  return (survey.activity_description || '').includes('__class_of:');
}

function getBaseId(survey) {
  const m = (survey.activity_description || '').match(/__class_of:([^_]+)/);
  return m ? m[1] : null;
}

function avg(nums) {
  if (!nums.length) return null;
  return (nums.reduce((a, b) => a + b, 0) / nums.length);
}

function ScaleBar({ value, max = 5 }) {
  const pct = value ? (value / max) * 100 : 0;
  const color = pct >= 70 ? 'bg-green-500' : pct >= 45 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-bold w-8 text-left">{value ? value.toFixed(1) : '—'}</span>
    </div>
  );
}

export default function FixedSurveyAnalytics() {
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  // Fetch all surveys (admin sees all)
  const { data: allSurveys = [], isLoading: surveysLoading } = useQuery({
    queryKey: ['analytics-all-surveys'],
    queryFn: () => base44.entities.Survey.list('-created_date', 500),
    enabled: !!currentUser,
  });

  // Only class surveys (copies of fixed surveys)
  const classSurveys = useMemo(() =>
    allSurveys.filter(s => isClassSurvey(s)),
    [allSurveys]
  );

  // Fetch all responses for class surveys
  const classSurveyIds = classSurveys.map(s => s.id);

  const { data: allResponses = [], isLoading: responsesLoading } = useQuery({
    queryKey: ['analytics-all-responses', classSurveyIds.length],
    queryFn: () => base44.entities.SurveyResponse.filter({ is_complete: true }, '-created_date', 2000),
    enabled: classSurveyIds.length > 0,
  });

  // Get questions for a representative class survey
  const representativeSurveyId = classSurveys[0]?.id;
  const { data: sampleQuestions = [] } = useQuery({
    queryKey: ['analytics-sample-questions', representativeSurveyId],
    queryFn: () => base44.entities.SurveyQuestion.filter({ survey_id: representativeSurveyId }, 'order_index'),
    enabled: !!representativeSurveyId,
  });

  const scaleQuestions = sampleQuestions.filter(q => q.question_type === 'scale_5');

  // Build enriched class survey list
  const enrichedClasses = useMemo(() => {
    return classSurveys.map(s => {
      const meta = parseClassMeta(s);
      const responses = allResponses.filter(r => r.survey_id === s.id);
      return { ...s, meta, responses };
    });
  }, [classSurveys, allResponses]);

  // Filter
  const filtered = useMemo(() => {
    return enrichedClasses.filter(c => {
      if (filterGrade !== 'all' && c.meta?.grade !== filterGrade) return false;
      if (filterSchool !== 'all' && c.meta?.school !== filterSchool) return false;
      return true;
    });
  }, [enrichedClasses, filterGrade, filterSchool]);

  // Compute aggregate stats per class
  const classStats = useMemo(() => {
    return filtered.map(c => {
      const scaleAvgs = scaleQuestions.map((q, i) => {
        const vals = c.responses
          .flatMap(r => r.answers || [])
          .filter(a => a.question_id === q.id)
          .map(a => parseFloat(a.value) || a.numeric_value)
          .filter(v => !isNaN(v));
        return { label: SCALE_QUESTIONS_LABELS[i] || q.prompt_hebrew?.slice(0, 30), avg: avg(vals), n: vals.length };
      });
      const overallAvg = avg(scaleAvgs.filter(s => s.avg !== null).map(s => s.avg));
      return { ...c, scaleAvgs, overallAvg };
    }).sort((a, b) => (b.responses.length - a.responses.length));
  }, [filtered, scaleQuestions]);

  // Aggregate by school
  const bySchool = useMemo(() => {
    const map = {};
    classStats.forEach(c => {
      const school = c.meta?.school || 'לא ידוע';
      if (!map[school]) map[school] = { responses: [], classes: 0, overallAvgs: [] };
      map[school].responses.push(...c.responses);
      map[school].classes++;
      if (c.overallAvg !== null) map[school].overallAvgs.push(c.overallAvg);
    });
    return Object.entries(map).map(([school, d]) => ({
      school,
      totalResponses: d.responses.length,
      classes: d.classes,
      avgScore: avg(d.overallAvgs),
    })).sort((a, b) => b.totalResponses - a.totalResponses);
  }, [classStats]);

  // Aggregate by grade
  const byGrade = useMemo(() => {
    const map = {};
    classStats.forEach(c => {
      const grade = c.meta?.grade || 'לא ידוע';
      if (!map[grade]) map[grade] = { responses: [], classes: 0, overallAvgs: [] };
      map[grade].responses.push(...c.responses);
      map[grade].classes++;
      if (c.overallAvg !== null) map[grade].overallAvgs.push(c.overallAvg);
    });
    return GRADE_LEVELS
      .filter(g => map[g])
      .map(g => ({
        grade: g,
        totalResponses: map[g].responses.length,
        classes: map[g].classes,
        avgScore: avg(map[g].overallAvgs),
      }));
  }, [classStats]);

  const totalResponses = filtered.reduce((s, c) => s + c.responses.length, 0);

  const isLoading = surveysLoading || responsesLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('AdminPrompts')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <ChevronRight className="w-5 h-5" />
            חזרה
          </Link>
          <h1 className="font-bold text-lg text-[#6B2D4A]">ניתוח שאלון "מה נשמע?"</h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Filters */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600">סינון:</span>

              <Select value={filterGrade} onValueChange={setFilterGrade} dir="rtl">
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="שכבה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל השכבות</SelectItem>
                  {GRADE_LEVELS.map(g => (
                    <SelectItem key={g} value={g}>שכבה {g}׳</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSchool} onValueChange={setFilterSchool} dir="rtl">
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="בית ספר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל בתי הספר</SelectItem>
                  {SCHOOLS_LIST.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(filterGrade !== 'all' || filterSchool !== 'all') && (
                <Button variant="ghost" size="sm" onClick={() => { setFilterGrade('all'); setFilterSchool('all'); }}>
                  <X className="w-3 h-3 ml-1" />נקה
                </Button>
              )}

              <div className="mr-auto flex gap-3">
                <Badge className="bg-blue-100 text-blue-800 border-0">{filtered.length} כיתות</Badge>
                <Badge className="bg-green-100 text-green-800 border-0">{totalResponses} תגובות</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#E85A24] animate-spin" />
          </div>
        )}

        {!isLoading && (
          <>
            {/* By Grade */}
            <div>
              <h2 className="font-bold text-[#6B2D4A] mb-3 flex items-center gap-2">
                <BarChart2 className="w-5 h-5" />
                ניתוח לפי שכבת גיל
              </h2>
              {byGrade.length === 0 ? (
                <Card className="bg-white border-0 shadow-sm">
                  <CardContent className="p-8 text-center text-gray-400">אין נתונים</CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {byGrade.map(g => (
                    <Card key={g.grade} className="bg-white border-0 shadow-sm">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-black text-[#6B2D4A]">{g.grade}׳</div>
                        <div className="text-sm text-gray-500 mt-1">{g.totalResponses} תגובות</div>
                        <div className="text-xs text-gray-400">{g.classes} כיתות</div>
                        {g.avgScore !== null && (
                          <div className="mt-2">
                            <ScaleBar value={g.avgScore} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* By School */}
            <div>
              <h2 className="font-bold text-[#6B2D4A] mb-3 flex items-center gap-2">
                <School className="w-5 h-5" />
                ניתוח לפי בית ספר
              </h2>
              {bySchool.length === 0 ? (
                <Card className="bg-white border-0 shadow-sm">
                  <CardContent className="p-8 text-center text-gray-400">אין נתונים</CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {bySchool.map(s => (
                    <Card key={s.school} className="bg-white border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <School className="w-4 h-4 text-[#E85A24]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">{s.school}</p>
                            <p className="text-xs text-gray-400">{s.classes} כיתות</p>
                          </div>
                          <div className="w-32">
                            {s.avgScore !== null ? <ScaleBar value={s.avgScore} /> : <span className="text-xs text-gray-400">אין ציון</span>}
                          </div>
                          <span className="text-sm font-semibold text-gray-600 w-20 text-left">{s.totalResponses} תגובות</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Class Detail */}
            <div>
              <h2 className="font-bold text-[#6B2D4A] mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                פירוט לפי כיתה ({classStats.length})
              </h2>
              {classStats.length === 0 ? (
                <Card className="bg-white border-0 shadow-sm">
                  <CardContent className="p-8 text-center text-gray-400">
                    אין כיתות לפי הסינון הנוכחי
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {classStats.map(c => (
                    <Card key={c.id} className="bg-white border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {c.meta ? `${c.meta.grade}׳${c.meta.number}` : '—'}
                              {c.meta?.school && <span className="text-sm text-gray-500 mr-2">— {c.meta.school}</span>}
                            </p>
                            <p className="text-xs text-gray-400">{c.responses.length} תגובות</p>
                          </div>
                          <div className="flex gap-2">
                            <Link to={createPageUrl('ResultsOverview') + `?surveyId=${c.id}`}>
                              <Button variant="outline" size="sm" className="text-[#6B2D4A] border-[#6B2D4A] text-xs">
                                <BarChart2 className="w-3 h-3 ml-1" />
                                תוצאות
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {c.scaleAvgs.length > 0 && c.responses.length > 0 && (
                          <div className="space-y-1.5">
                            {c.scaleAvgs.map((sq, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-28 shrink-0 truncate">{sq.label}</span>
                                <div className="flex-1">
                                  <ScaleBar value={sq.avg} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {c.responses.length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-2">אין תגובות עדיין</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}