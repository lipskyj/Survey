import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Home, FileText, BarChart3, Settings } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Layout({ children, currentPageName }) {
  const isRespondentFlow = ['RespondIntro', 'RespondQuestion', 'RespondComplete'].includes(currentPageName);

  // Auth guard: redirect to login for all non-respondent pages
  useEffect(() => {
    if (!isRespondentFlow) {
      base44.auth.isAuthenticated().then(isAuth => {
        if (!isAuth) {
          base44.auth.redirectToLogin(window.location.href);
        }
      });
    }
  }, [isRespondentFlow]);
  const isBuilderFlow = [
            'SurveyLanguage', 'ActivityDescription', 'Audience', 'GradeRange', 'EventType', 
            'ContentFocus', 'EvaluationGoal', 'SuccessDefinition',
            'ProfileSummary', 'GenerateSurvey', 'SurveyEditor', 'PublishShare',
            'EditQuestion', 'AddQuestion', 'ReorderQuestions', 'AdminPrompts'
          ].includes(currentPageName);
  
  if (isRespondentFlow) {
    return (
      <div dir="rtl" className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <style>{`
          :root {
            --color-primary: #E85A24;
            --color-primary-dark: #D14A1A;
            --color-secondary: #6B2D4A;
            --color-background: #FFFAF8;
          }
          * {
            font-family: 'Heebo', 'Inter', sans-serif;
          }
        `}</style>
        {children}
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800;900&display=swap');
        
        :root {
          --color-primary: #E85A24;
          --color-primary-dark: #D14A1A;
          --color-secondary: #6B2D4A;
          --color-background: #FFFFFF;
        }
        * {
          font-family: 'Heebo', sans-serif;
        }
        .swipe-hint {
          animation: swipeHint 2s ease-in-out infinite;
        }
        @keyframes swipeHint {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-10px); }
        }
      `}</style>
      
      {!isBuilderFlow && (
        <header className="bg-white sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center gap-2 sm:gap-3">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695a5f05dbd82ab5fc602da8/ca3e3ae45_2024.png" 
                  alt="עתיד רשת חינוך"
                  className="h-12 sm:h-14 w-auto"
                />
              </div>
              
              <nav className="hidden md:flex items-center gap-3">
                <Link to={createPageUrl('Home')} className="px-5 py-2.5 rounded-full text-[#6B2D4A] hover:bg-gray-50 transition-all font-medium flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  בית
                </Link>
              </nav>
            </div>
          </div>
        </header>
      )}
      
      <main className={isBuilderFlow ? '' : 'pb-24 md:pb-0'}>
        {children}
      </main>
      
      {!isBuilderFlow && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-center h-20 px-2">
            <Link to={createPageUrl('Home')} className="flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-[#E85A24] transition-colors min-w-[72px]">
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">בית</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}