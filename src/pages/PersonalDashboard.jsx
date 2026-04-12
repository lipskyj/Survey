import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart2, Users, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { isClassSurvey, buildEnrichedClasses, computeQuestionStats } from '@/lib/analyticsHelpers';

export default function PersonalDashboard() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const { data: mySurveys = [] } = useQuery({
    queryKey: ['personal-surveys', currentUser?.email],
    queryFn: () => base44.entities.Survey.filter({ created_by: currentUser.email }, '-created_date', 200),
    enabled: !!currentUser,
  });

  const publishedSurveys = mySurveys.filter(s => s.status === 'published');
  const draftSurveys = mySurveys.filter(s => s.status === 'draft');

  // Class surveys created by this user (for "Return to Routine" links)
  const myClassSurveys = mySurveys.filter(isClassSurvey);

  const { data: allResponses = [] } = useQuery({
    queryKey: ['personal-responses', currentUser?.email],
    queryFn: async () => {
      const ids = publishedSurveys.map(s => s.id);
      if (ids.length === 0) return [];
      return base44.entities.SurveyResponse.filter({ is_complete: true }, '-created_date', 3000);
    },
    enabled: publishedSurveys.length > 0,
  });

  // Filter responses to only belong to this user's surveys
  const myPublishedIds = new Set(publishedSurveys.map(s => s.id));
  const myResponses = allResponses.filter(r => myPublishedIds.has(r.survey_id));

  const enrichedClasses = useMemo(() =>
    buildEnrichedClasses(myClassSurveys, myResponses),
    [myClassSurveys, myResponses]
  );

  const totalResponses = myResponses.length;
  const classesWithResponses = enrichedClasses.filter(c => c.responses?.length > 0).length;

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon"><ArrowRight className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#1E3A6E]">לוח בקרה אישי</h1>
          <p className="text-gray-500 text-sm">{currentUser.full_name || currentUser.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-green-600">{publishedSurveys.length}</div>
            <div className="text-xs text-gray-500 mt-1">סקרים פעילים</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-amber-500">{draftSurveys.length}</div>
            <div className="text-xs text-gray-500 mt-1">טיוטות</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-[#E85A24]">{totalResponses}</div>
            <div className="text-xs text-gray-500 mt-1">תגובות סה״כ</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-[#1E3A6E]">{classesWithResponses}</div>
            <div className="text-xs text-gray-500 mt-1">כיתות הגיבו</div>
          </CardContent>
        </Card>
      </div>

      {/* Surveys list */}
      <h2 className="font-bold text-[#6B2D4A] mb-3">הסקרים שלי</h2>
      {publishedSurveys.length === 0 && draftSurveys.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-10 text-center text-gray-400">
            <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>לא יצרת סקרים עדיין</p>
            <Link to={createPageUrl('SurveyLanguage')}>
              <Button className="mt-4 bg-[#E85A24] hover:bg-[#D14A1A]">צור סקר ראשון</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {[...publishedSurveys, ...draftSurveys].map(s => {
            const responses = myResponses.filter(r => r.survey_id === s.id);
            return (
              <Card key={s.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.status === 'published' ? 'bg-green-100' : 'bg-amber-100'}`}>
                        {s.status === 'published'
                          ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                          : <Clock className="w-4 h-4 text-amber-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate text-sm">{s.title || 'ללא כותרת'}</p>
                        <p className="text-xs text-gray-400">{responses.length} תגובות</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {s.status === 'published' && (
                        <Link to={createPageUrl('ResultsOverview') + `?surveyId=${s.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs">תוצאות</Button>
                        </Link>
                      )}
                      {s.status === 'draft' && (
                        <Link to={createPageUrl('SurveyEditor') + `?surveyId=${s.id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs">עריכה</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}