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
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 bg-orange-100 text-[#E85A24] px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          יצירת סקרים חכמה
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#6B2D4A] mb-4">
          צור סקר בדקות
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
          מערכת חכמה ליצירת סקרי משוב לפעילויות חינוכיות.
          תאר את הפעילות - ונייצר עבורך סקר מותאם.
        </p>
        
        <Link to={createPageUrl('ActivityDescription')}>
          <Button className="bg-[#E85A24] hover:bg-[#D14A1A] text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl transition-all">
            <Plus className="w-5 h-5 ml-2" />
            צור סקר חדש
          </Button>
        </Link>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#E85A24]">{surveys.length}</div>
              <div className="text-sm text-gray-500">סה״כ סקרים</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600">{publishedCount}</div>
              <div className="text-sm text-gray-500">מפורסמים</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-amber-500">{draftCount}</div>
              <div className="text-sm text-gray-500">טיוטות</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#6B2D4A]">
                {surveys.reduce((acc, s) => acc + (s.responses_count || 0), 0)}
              </div>
              <div className="text-sm text-gray-500">תגובות</div>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#6B2D4A]">סקרים אחרונים</h2>
            <Link to={createPageUrl('SurveyManagement')} className="text-[#E85A24] hover:underline text-sm flex items-center gap-1">
              כל הסקרים
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentSurveys.map((survey) => (
              <Link 
                key={survey.id}
                to={createPageUrl(survey.status === 'draft' ? 'SurveyEditor' : 'ResultsOverview') + `?surveyId=${survey.id}`}
              >
                <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        survey.status === 'published' ? 'bg-green-100 text-green-600' :
                        survey.status === 'draft' ? 'bg-amber-100 text-amber-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {survey.title || survey.activity_description?.slice(0, 40) || 'סקר ללא שם'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {survey.status === 'published' ? 'מפורסם' : 
                           survey.status === 'draft' ? 'טיוטה' : 'סגור'}
                          {survey.responses_count > 0 && ` • ${survey.responses_count} תגובות`}
                        </p>
                      </div>
                    </div>
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
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
          className="text-center py-12 bg-white rounded-2xl shadow-sm"
        >
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-[#E85A24]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">אין סקרים עדיין</h3>
          <p className="text-gray-500 mb-6">צור את הסקר הראשון שלך בכמה צעדים פשוטים</p>
          <Link to={createPageUrl('ActivityDescription')}>
            <Button className="bg-[#E85A24] hover:bg-[#D14A1A] text-white">
              <Plus className="w-4 h-4 ml-2" />
              צור סקר חדש
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}