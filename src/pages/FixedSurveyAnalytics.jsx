import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ChevronRight, Filter, X, BarChart2, School, Layers, Sparkles } from 'lucide-react';
import { SCHOOLS_LIST, GRADE_LEVELS } from '@/lib/schoolsList';
import {
  isClassSurvey, buildEnrichedClasses, aggregateBy, computeQuestionStats
} from '@/lib/analyticsHelpers';

import OverviewTab from '@/components/analytics/OverviewTab';
import SchoolTab from '@/components/analytics/SchoolTab';
import GradeTab from '@/components/analytics/GradeTab';
import InsightsTab from '@/components/analytics/InsightsTab';

const TABS = [
  { id: 'overview', label: 'סקירה', icon: BarChart2 },
  { id: 'school',   label: 'בתי ספר', icon: School },
  { id: 'grade',    label: 'שכבות גיל', icon: Layers },
  { id: 'insights', label: 'תובנות AI', icon: Sparkles },
];

export default function FixedSurveyAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  // ── Data fetching ──────────────────────────────────────────
  const { data: allSurveys = [], isLoading: surveysLoading } = useQuery({
    queryKey: ['analytics-surveys'],
    queryFn: () => base44.entities.Survey.list('-created_date', 1000),
    enabled: !!currentUser,
  });

  const classSurveys = useMemo(() =>
    allSurveys.filter(isClassSurvey),
    [allSurveys]
  );

  const { data: allResponses = [], isLoading: responsesLoading } = useQuery({
    queryKey: ['analytics-responses', classSurveys.length],
    queryFn: () => base44.entities.SurveyResponse.filter({ is_complete: true }, '-created_date', 5000),
    enabled: classSurveys.length > 0,
  });

  // Get questions from the BASE (non-class) fixed survey — it has the full template
  const baseSurvey = useMemo(() =>
    allSurveys.find(s =>
      !isClassSurvey(s) &&
      (s.title?.startsWith('שאלון "מה נשמע?"') ||
       s.title?.startsWith('استبيان "كيف') ||
       s.title?.startsWith('שאלון חזרה לשגרה') ||
       s.title?.startsWith('استبيان العودة'))
    ),
    [allSurveys]
  );
  // Fallback: use first class survey if no base found
  const questionSourceId = baseSurvey?.id || classSurveys[0]?.id;
  const { data: sampleQuestions = [] } = useQuery({
    queryKey: ['analytics-questions', questionSourceId],
    queryFn: () => base44.entities.SurveyQuestion.filter({ survey_id: questionSourceId }, 'order_index'),
    enabled: !!questionSourceId,
  });
  const scaleQuestions = sampleQuestions.filter(q =>
    q.question_type === 'scale_5' || q.question_type === 'scale_7' || q.question_type === 'bottom_line'
  );

  // ── Enriched + filtered ────────────────────────────────────
  const enrichedAll = useMemo(() =>
    buildEnrichedClasses(classSurveys, allResponses),
    [classSurveys, allResponses]
  );

  const enrichedFiltered = useMemo(() =>
    enrichedAll.filter(c => {
      if (filterGrade !== 'all' && c.meta?.grade !== filterGrade) return false;
      if (filterSchool !== 'all' && c.meta?.school !== filterSchool) return false;
      return true;
    }),
    [enrichedAll, filterGrade, filterSchool]
  );

  const filteredResponses = useMemo(() =>
    enrichedFiltered.flatMap(c => c.responses),
    [enrichedFiltered]
  );

  // ── Aggregations ───────────────────────────────────────────
  const bySchool = useMemo(() =>
    aggregateBy(enrichedFiltered, c => c.meta?.school, scaleQuestions)
      .sort((a, b) => b.responseCount - a.responseCount),
    [enrichedFiltered, scaleQuestions]
  );

  const byGrade = useMemo(() =>
    aggregateBy(enrichedFiltered, c => c.meta?.grade, scaleQuestions),
    [enrichedFiltered, scaleQuestions]
  );

  const questionStats = useMemo(() =>
    computeQuestionStats(scaleQuestions, filteredResponses),
    [scaleQuestions, filteredResponses]
  );

  const isLoading = surveysLoading || responsesLoading;
  const totalResponses = filteredResponses.length;

  // Available filter options (only from actual data)
  const availableGrades = useMemo(() =>
    GRADE_LEVELS.filter(g => enrichedAll.some(c => c.meta?.grade === g)),
    [enrichedAll]
  );
  const availableSchools = useMemo(() =>
    SCHOOLS_LIST.filter(s => enrichedAll.some(c => c.meta?.school === s)),
    [enrichedAll]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={createPageUrl('FixedSurveySetup')} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm">
            <ChevronRight className="w-4 h-4" />
            חזרה
          </Link>
          <h1 className="font-bold text-[#6B2D4A]">לוח בקרה — מה נשמע?</h1>
          <div className="flex gap-2">
            <Badge className="bg-green-100 text-green-700 border-0">{totalResponses.toLocaleString()} תגובות</Badge>
            <Badge className="bg-blue-100 text-blue-700 border-0">{enrichedFiltered.length} כיתות</Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-5xl mx-auto px-4 pb-3 flex flex-wrap gap-2 items-center">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <Select value={filterGrade} onValueChange={setFilterGrade} dir="rtl">
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue placeholder="שכבה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל השכבות</SelectItem>
              {availableGrades.map(g => (
                <SelectItem key={g} value={g}>{g}׳</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterSchool} onValueChange={setFilterSchool} dir="rtl">
            <SelectTrigger className="h-8 w-52 text-xs">
              <SelectValue placeholder="בית ספר" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל בתי הספר</SelectItem>
              {availableSchools.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(filterGrade !== 'all' || filterSchool !== 'all') && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-500"
              onClick={() => { setFilterGrade('all'); setFilterSchool('all'); }}>
              <X className="w-3 h-3 ml-1" /> נקה סינון
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 border-t border-gray-100">
          <div className="flex gap-0">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#E85A24] text-[#E85A24]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 text-[#E85A24] animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewTab
                enrichedClasses={enrichedFiltered}
                questionStats={questionStats}
                allResponses={filteredResponses}
              />
            )}
            {activeTab === 'school' && (
              <SchoolTab bySchool={bySchool} scaleQuestions={scaleQuestions} />
            )}
            {activeTab === 'grade' && (
              <GradeTab
                byGrade={byGrade}
                scaleQuestions={scaleQuestions}
                enrichedClasses={enrichedFiltered}
              />
            )}
            {activeTab === 'insights' && (
              <InsightsTab
                questionStats={questionStats}
                bySchool={bySchool}
                byGrade={byGrade}
                totalResponses={totalResponses}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}