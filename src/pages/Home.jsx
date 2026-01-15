import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { Plus, FileText, Edit3, CheckCircle2, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import OnboardingCarousel from '@/components/OnboardingCarousel';

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: surveys = [] } = useQuery({
    queryKey: ['surveys-home'],
    queryFn: () => base44.entities.Survey.list('-created_date'),
  });

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding && surveys.length === 0) {
      setShowOnboarding(true);
    }
  }, [surveys]);

  const handleDismissOnboarding = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  const publishedSurveys = surveys.filter(s => s.status === 'published');
  const draftSurveys = surveys.filter(s => s.status === 'draft');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-16">
      {/* Onboarding Carousel */}
      {showOnboarding && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <OnboardingCarousel onDismiss={handleDismissOnboarding} />
        </motion.div>
      )}

      {/* Main Action Cards */}
      <div className="grid gap-4 sm:gap-6">
        {/* Create New Survey */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showOnboarding ? 0 : 0.1 }}
        >
          <Link to={createPageUrl('ActivityDescription')}>
            <Card className="bg-gradient-to-br from-[#E85A24] to-[#D14A1A] border-0 shadow-lg hover:shadow-xl transition-all rounded-3xl group cursor-pointer">
              <CardContent className="p-8 sm:p-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">סקר חדש</h2>
                      <p className="text-white/90 text-sm sm:text-base font-medium">צור סקר חכם בדקות</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Published Surveys */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showOnboarding ? 0 : 0.2 }}
        >
          <Link to={createPageUrl('SurveyManagement') + '?filter=published'}>
            <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-3xl group cursor-pointer">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-[#6B2D4A] mb-1">סקרים פעילים</h3>
                      <p className="text-gray-500 text-sm sm:text-base font-medium">
                        {publishedSurveys.length} סקרים מפורסמים
                      </p>
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-green-600">
                    {publishedSurveys.length}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Draft Surveys */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showOnboarding ? 0 : 0.3 }}
        >
          <Link to={createPageUrl('SurveyManagement') + '?filter=draft'}>
            <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-3xl group cursor-pointer">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Edit3 className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-[#6B2D4A] mb-1">טיוטות</h3>
                      <p className="text-gray-500 text-sm sm:text-base font-medium">
                        {draftSurveys.length} סקרים בעבודה
                      </p>
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-amber-600">
                    {draftSurveys.length}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Admin Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showOnboarding ? 0 : 0.4 }}
        >
          <Link to={createPageUrl('AdminPrompts')}>
            <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-3xl group cursor-pointer">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Settings className="w-7 h-7 sm:w-8 sm:h-8 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-[#6B2D4A] mb-1">הגדרות מנהל</h3>
                    <p className="text-gray-500 text-sm sm:text-base font-medium">
                      ניהול פרומפטים ושפת השאלונים
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}