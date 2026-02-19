import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from 'framer-motion';
import { 
  BarChart3, Users, Clock, TrendingUp, 
  ChevronLeft, FileText, Loader2, AlertCircle,
  Sparkles, Download
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export default function ResultsOverview() {
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  // Load surveys — only the current user's
  const { data: surveys = [], isLoading: surveysLoading } = useQuery({
    queryKey: ['surveys-for-results', currentUser?.email],
    queryFn: () => base44.entities.Survey.filter(
      { created_by: currentUser.email, status: { $in: ['published', 'closed', 'draft'] } },
      '-published_at'
    ),
    enabled: !!currentUser,
  });

  // Set initial survey
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const surveyId = params.get('surveyId');
    if (surveyId) {
      setSelectedSurveyId(surveyId);
    } else if (surveys.length > 0 && !selectedSurveyId) {
      setSelectedSurveyId(surveys[0].id);
    }
  }, [surveys]);

  // Load selected survey details
  const { data: survey } = useQuery({
    queryKey: ['survey-details', selectedSurveyId],
    queryFn: async () => {
      const surveys = await base44.entities.Survey.filter({ id: selectedSurveyId });
      return surveys[0] || null;
    },
    enabled: !!selectedSurveyId
  });

  // Load responses
  const { data: responses = [], isLoading: responsesLoading } = useQuery({
    queryKey: ['survey-responses', selectedSurveyId],
    queryFn: () => base44.entities.SurveyResponse.filter(
      { survey_id: selectedSurveyId },
      '-created_date'
    ),
    enabled: !!selectedSurveyId
  });

  const completedResponses = responses.filter(r => r.is_complete);
  const completionRate = responses.length > 0 
    ? Math.round((completedResponses.length / responses.length) * 100) 
    : 0;
  
  const avgDuration = completedResponses.length > 0
    ? Math.round(completedResponses.reduce((acc, r) => acc + (r.duration_seconds || 60), 0) / completedResponses.length / 60)
    : 0;

  const lastResponseTime = responses.length > 0 
    ? formatDistanceToNow(new Date(responses[0].created_date), { locale: he, addSuffix: true })
    : 'אין תגובות';

  if (surveysLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#E85A24] animate-spin" />
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">אין סקרים לניתוח</h3>
            <p className="text-gray-500 mb-6">יש לפרסם סקר כדי לראות תוצאות</p>
            <Link to={createPageUrl('SurveyManagement')}>
              <Button variant="outline">
                לניהול הסקרים
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#6B2D4A]">תוצאות הסקר</h1>
          {survey && (
            <p className="text-gray-500 mt-1">
              {survey.title || survey.activity_description?.slice(0, 50)}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedSurveyId || ''} onValueChange={setSelectedSurveyId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="בחר סקר" />
            </SelectTrigger>
            <SelectContent>
              {surveys.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title || s.activity_description?.slice(0, 30) || 'סקר ללא שם'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{completedResponses.length}</p>
                  <p className="text-sm text-gray-500">תגובות שהושלמו</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{completionRate}%</p>
                  <p className="text-sm text-gray-500">שיעור השלמה</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{avgDuration || '~2'} דק׳</p>
                  <p className="text-sm text-gray-500">זמן מילוי ממוצע</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-[#E85A24]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 truncate">{lastResponseTime}</p>
                  <p className="text-sm text-gray-500">תגובה אחרונה</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Low N Warning */}
      {completedResponses.length > 0 && completedResponses.length < 10 && (
        <Card className="bg-amber-50 border-amber-200 mb-8">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">מספר תגובות נמוך</p>
              <p className="text-sm text-amber-700">
                עם פחות מ-10 תגובות, התוצאות עשויות להיות פחות מייצגות. מומלץ להמתין ליותר משיבים.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to={createPageUrl('ResultsByQuestion') + `?surveyId=${selectedSurveyId}`}>
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">ניתוח לפי שאלה</h3>
                  <p className="text-sm text-gray-500">
                    התפלגות התשובות, ממוצעים וסטטיסטיקות לכל שאלה
                  </p>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('AIInsights') + `?surveyId=${selectedSurveyId}`}>
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">תובנות AI</h3>
                  <p className="text-sm text-gray-500">
                    ניתוח חכם של התוצאות עם המלצות לפעולה
                  </p>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('ExportData') + `?surveyId=${selectedSurveyId}`}>
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                    <Download className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">ייצוא נתונים</h3>
                  <p className="text-sm text-gray-500">
                    הורד את התוצאות בפורמט CSV או Excel
                  </p>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* No Responses State */}
      {completedResponses.length === 0 && (
        <Card className="bg-white border-0 shadow-sm mt-8">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">אין תגובות עדיין</h3>
            <p className="text-gray-500 mb-6">שתף את הסקר כדי להתחיל לאסוף משוב</p>
            <Link to={createPageUrl('PublishShare') + `?surveyId=${selectedSurveyId}`}>
              <Button className="bg-[#E85A24] hover:bg-[#D14A1A] text-white">
                קבל קישור לשיתוף
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}