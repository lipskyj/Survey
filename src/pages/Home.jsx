import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { Plus, FileText, BarChart3, ArrowLeft, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Home() {
  const { data: surveys = [] } = useQuery({
    queryKey: ['surveys-preview'],
    queryFn: () => base44.entities.Survey.list('-created_date', 5),
  });

  const recentSurveys = surveys.slice(0, 3);
  const publishedCount = surveys.filter(s => s.status === 'published').length;
  const draftCount = surveys.filter(s => s.status === 'draft').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 md:py-16">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 sm:mb-16"
      >
        <div className="inline-flex items-center gap-2 bg-orange-50 text-[#E85A24] px-4 py-2 rounded-full text-xs sm:text-sm font-bold mb-6">
          <Sparkles className="w-4 h-4" />
          יצירת סקרים חכמה
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-[#6B2D4A] mb-4 leading-tight">
          צור סקר בדקות
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 font-medium px-4">
          מערכת חכמה ליצירת סקרי משוב לפעילויות חינוכיות.
          תאר את הפעילות - ונייצר עבורך סקר מותאם.
        </p>
        
        <Link to={createPageUrl('ActivityDescription')}>
          <Button className="bg-[#E85A24] hover:bg-[#D14A1A] text-white px-8 sm:px-12 py-6 sm:py-7 text-base sm:text-lg rounded-full shadow-lg hover:shadow-xl transition-all font-bold">
            <Plus className="w-5 h-5 ml-2" />
            צור סקר חדש
          </Button>
        </Link>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-3xl">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-black text-[#E85A24]">{surveys.length}</div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium mt-1">סה״כ סקרים</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-3xl">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-black text-green-600">{publishedCount}</div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium mt-1">מפורסמים</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-3xl">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-black text-amber-500">{draftCount}</div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium mt-1">טיוטות</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow rounded-3xl">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-2xl sm:text-3xl font-black text-[#6B2D4A]">
                {surveys.reduce((acc, s) => acc + (s.responses_count || 0), 0)}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium mt-1">תגובות</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Surveys */}
      {recentSurveys.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-black text-[#6B2D4A]">סקרים אחרונים</h2>
            <Link to={createPageUrl('SurveyManagement')} className="text-[#E85A24] hover:opacity-80 text-xs sm:text-sm flex items-center gap-1 font-bold">
              כל הסקרים
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentSurveys.map((survey) => (
              <Link 
                key={survey.id}
                to={createPageUrl(survey.status === 'draft' ? 'SurveyEditor' : 'ResultsOverview') + `?surveyId=${survey.id}`}
              >
                <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-3xl">
                  <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        survey.status === 'published' ? 'bg-green-50 text-green-600' :
                        survey.status === 'draft' ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm sm:text-base text-[#6B2D4A] truncate">
                          {survey.title || survey.activity_description?.slice(0, 40) || 'סקר ללא שם'}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 font-medium">
                          {survey.status === 'published' ? 'מפורסם' : 
                           survey.status === 'draft' ? 'טיוטה' : 'סגור'}
                          {survey.responses_count > 0 && ` • ${survey.responses_count} תגובות`}
                        </p>
                      </div>
                    </div>
                    <ArrowLeft className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {surveys.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 sm:py-16 bg-white rounded-3xl shadow-sm border border-gray-100"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 sm:w-8 sm:h-8 text-[#E85A24]" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#6B2D4A] mb-2">אין סקרים עדיין</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-6 px-4">צור את הסקר הראשון שלך בכמה צעדים פשוטים</p>
          <Link to={createPageUrl('ActivityDescription')}>
            <Button className="bg-[#E85A24] hover:bg-[#D14A1A] text-white rounded-full px-6 sm:px-8 py-5 sm:py-6 font-bold text-sm sm:text-base">
              <Plus className="w-4 h-4 ml-2" />
              צור סקר חדש
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}