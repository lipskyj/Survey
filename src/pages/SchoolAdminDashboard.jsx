import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, School, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { parseClassMeta, isClassSurvey, buildEnrichedClasses, computeQuestionStats } from '@/lib/analyticsHelpers';
import OverviewTab from '@/components/analytics/OverviewTab';

export default function SchoolAdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  React.useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const { data: allSurveys = [] } = useQuery({
    queryKey: ['school-admin-surveys', currentUser?.school],
    queryFn: () => base44.entities.Survey.list('-created_date', 500),
    enabled: !!currentUser?.school,
  });

  const { data: allResponses = [] } = useQuery({
    queryKey: ['school-admin-responses'],
    queryFn: () => base44.entities.SurveyResponse.list('-created_date', 2000),
    enabled: !!currentUser?.school,
  });

  // All class surveys belonging to this school
  const schoolClassSurveys = useMemo(() => {
    if (!currentUser?.school) return [];
    return allSurveys.filter(s => {
      if (!isClassSurvey(s)) return false;
      const meta = parseClassMeta(s);
      return meta?.school === currentUser.school;
    });
  }, [allSurveys, currentUser]);

  // Regular surveys created by users at this school — keyed by created_by match
  const schoolUserEmails = useMemo(() => {
    // We don't have a direct mapping here, so we rely on class meta
    return new Set();
  }, []);

  const enrichedClasses = useMemo(() =>
    buildEnrichedClasses(schoolClassSurveys, allResponses),
    [schoolClassSurveys, allResponses]
  );

  const allSchoolResponses = useMemo(() =>
    enrichedClasses.flatMap(c => c.responses),
    [enrichedClasses]
  );

  // Get questions from any class survey
  const { data: sampleQuestions = [] } = useQuery({
    queryKey: ['school-admin-questions', schoolClassSurveys[0]?.id],
    queryFn: () => base44.entities.SurveyQuestion.filter({ survey_id: schoolClassSurveys[0].id }, 'order_index'),
    enabled: schoolClassSurveys.length > 0,
  });

  const questionStats = useMemo(() =>
    computeQuestionStats(sampleQuestions, allSchoolResponses),
    [sampleQuestions, allSchoolResponses]
  );

  const totalResponses = allSchoolResponses.length;
  const classCount = schoolClassSurveys.length;
  const avgScore = questionStats
    .filter(q => q.avg !== undefined && q.avg !== null)
    .reduce((sum, q, _, arr) => sum + (q.avg / (q.max || 5)) * 5 / arr.length, 0);

  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;
  }

  if (!currentUser.school) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center" dir="rtl">
        <School className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-600 mb-2">לא שויכת לבית ספר</h2>
        <p className="text-gray-400 text-sm">בקש/י מהאדמין המרכזי לשייך אותך לבית ספר</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon"><ArrowRight className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#1E3A6E]">לוח בקרה — {currentUser.school}</h1>
          <p className="text-gray-500 text-sm">כל הסקרים של בית הספר</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-[#1E3A6E]">{totalResponses}</div>
            <div className="text-xs text-gray-500 mt-1">תגובות</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-[#E85A24]">{classCount}</div>
            <div className="text-xs text-gray-500 mt-1">כיתות</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-green-600">{avgScore ? avgScore.toFixed(1) : '—'}</div>
            <div className="text-xs text-gray-500 mt-1">ממוצע כללי</div>
          </CardContent>
        </Card>
      </div>

      {/* Overview */}
      {totalResponses > 0 ? (
        <OverviewTab
          questionStats={questionStats}
          totalResponses={totalResponses}
          classCount={classCount}
          schoolCount={1}
          overallAvg={avgScore}
        />
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center text-gray-400">
            <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>אין תגובות עדיין לבית הספר {currentUser.school}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}