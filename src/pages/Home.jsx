import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import SchoolSetupModal from '@/components/SchoolSetupModal';
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { Plus, FileText, Edit3, CheckCircle2, Settings, Layers, BookOpen, BarChart2, School, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import OnboardingCarousel from '@/components/OnboardingCarousel';
import WelcomeModal from '@/components/WelcomeModal';

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSchoolSetup, setShowSchoolSetup] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (u.role !== 'admin' && u.role !== 'network_admin' && u.school === undefined) {
        setShowSchoolSetup(true);
      }
      // Show welcome modal once per user
      const key = `hasSeenWelcome_${u.email}`;
      if (!localStorage.getItem(key)) {
        setShowWelcome(true);
      }
    }).catch(() => {});
  }, []);

  const { data: allSurveys = [] } = useQuery({
    queryKey: ['surveys-home', currentUser?.email, currentUser?.role],
    queryFn: async () => {
      if (!currentUser) return [];
      if (currentUser.role === 'admin') {
        return base44.entities.Survey.list('-created_date', 500);
      }
      return base44.entities.Survey.filter({ created_by: currentUser.email }, '-created_date');
    },
    enabled: currentUser !== null,
  });

  const publishedSurveys = allSurveys.filter(s => s.status === 'published');
  const draftSurveys = allSurveys.filter(s => s.status === 'draft');
  const candidateSurveys = allSurveys.filter(s => s.status === 'candidate');

  useEffect(() => {
    if (!currentUser) return;
    const key = `hasSeenOnboarding_${currentUser.email}`;
    const hasSeenOnboarding = localStorage.getItem(key);
    const visibleSurveys = allSurveys.filter(s => s.status !== 'candidate');
    if (!hasSeenOnboarding && visibleSurveys.length === 0) {
      setShowOnboarding(true);
    }
  }, [allSurveys, currentUser]);

  const handleDismissOnboarding = () => {
    if (currentUser) localStorage.setItem(`hasSeenOnboarding_${currentUser.email}`, 'true');
    setShowOnboarding(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-16">
      <SchoolSetupModal
        open={showSchoolSetup}
        onDone={(school) => {
          setCurrentUser(prev => ({ ...prev, school }));
          setShowSchoolSetup(false);
        }}
      />
      <WelcomeModal
        open={showWelcome}
        onClose={() => {
          localStorage.setItem(`hasSeenWelcome_${currentUser?.email}`, 'true');
          setShowWelcome(false);
        }}
      />
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
        {/* Fixed Survey — Return to Routine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showOnboarding ? 0 : 0.1 }}
        >
          <Link to={createPageUrl('FixedSurveySetup')}>
            <Card className="bg-gradient-to-br from-[#1E3A6E] to-[#2952A3] border-0 shadow-lg hover:shadow-xl transition-all rounded-3xl group cursor-pointer">
              <CardContent className="p-8 sm:p-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">שאלון חזרה לשגרה</h2>
                      <p className="text-white/90 text-sm sm:text-base font-medium">שאלון קבוע לכל הכיתות</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Create New Survey */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: showOnboarding ? 0 : 0.15 }}
        >
          <Link to={createPageUrl('SurveyLanguage')}>
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

        {/* Candidate Surveys — shown to all users when they have unchosen versions */}
        {candidateSurveys.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: showOnboarding ? 0 : 0.35 }}
          >
            <Link to={createPageUrl('SurveyManagement') + '?filter=candidate'}>
              <Card className="bg-white border border-purple-100 shadow-sm hover:shadow-md transition-all rounded-3xl group cursor-pointer">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Layers className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-[#6B2D4A] mb-1">לא נבחר</h3>
                        <p className="text-gray-500 text-sm sm:text-base font-medium">
                          {candidateSurveys.length} גרסאות AI ממתינות
                        </p>
                      </div>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-purple-600">
                      {candidateSurveys.length}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* Personal Dashboard — for regular teachers */}
        {currentUser && currentUser.role !== 'admin' && currentUser.role !== 'school_admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: showOnboarding ? 0 : 0.38 }}
          >
            <Link to={createPageUrl('PersonalDashboard')}>
              <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-3xl group cursor-pointer">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 sm:gap-5">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#1E3A6E]/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <BarChart2 className="w-7 h-7 sm:w-8 sm:h-8 text-[#1E3A6E]" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-[#6B2D4A] mb-1">לוח בקרה אישי</h3>
                        <p className="text-gray-500 text-sm sm:text-base font-medium">תוצאות וסטטיסטיקות של הסקרים שלי</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* School Admin Dashboard */}
        {currentUser?.role === 'school_admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: showOnboarding ? 0 : 0.38 }}
          >
            <Link to={createPageUrl('SchoolAdminDashboard')}>
              <Card className="bg-gradient-to-br from-[#1E3A6E] to-[#2952A3] border-0 shadow-lg hover:shadow-xl transition-all rounded-3xl group cursor-pointer">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <School className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white mb-1">לוח הבקרה שלי</h3>
                      <p className="text-white/80 text-sm sm:text-base font-medium">
                        {currentUser?.school ? `נתוני ${currentUser.school}` : 'נתוני בית הספר שלי'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* Analytics Dashboard — for admins and network_admins */}
        {(currentUser?.role === 'admin' || currentUser?.role === 'network_admin') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: showOnboarding ? 0 : 0.38 }}
          >
            <Link to={createPageUrl('FixedSurveyAnalytics')}>
              <Card className="bg-gradient-to-br from-purple-600 to-[#6B2D4A] border-0 shadow-lg hover:shadow-xl transition-all rounded-3xl group cursor-pointer">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BarChart2 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white mb-1">לוח בקרה — מה נשמע?</h3>
                      <p className="text-white/80 text-sm sm:text-base font-medium">ניתוח תוצאות כלל הכיתות</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* Manage School Admins — only for admins */}
        {currentUser?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: showOnboarding ? 0 : 0.39 }}
          >
            <Link to={createPageUrl('ManageSchoolAdmins')}>
              <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-3xl group cursor-pointer">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-4 sm:gap-5">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-[#1E3A6E]" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-[#6B2D4A] mb-1">אדמינים מקומיים</h3>
                      <p className="text-gray-500 text-sm sm:text-base font-medium">שייוך משתמשים לבתי ספר</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* Admin Settings — only for admins */}
        {currentUser?.role === 'admin' && (
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
        )}
      </div>
    </div>
  );
}