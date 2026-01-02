import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Home, FileText, BarChart3, Settings } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const isRespondentFlow = ['RespondIntro', 'RespondQuestion', 'RespondComplete'].includes(currentPageName);
  const isBuilderFlow = [
    'ActivityDescription', 'Audience', 'GradeRange', 'EventType', 
    'ContentFocus', 'EvaluationGoal', 'SuccessDefinition',
    'ProfileSummary', 'GenerateSurvey', 'SurveyEditor', 'PublishShare',
    'EditQuestion', 'AddQuestion', 'ReorderQuestions'
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
    <div dir="rtl" className="min-h-screen bg-gray-50">
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
        .swipe-hint {
          animation: swipeHint 2s ease-in-out infinite;
        }
        @keyframes swipeHint {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-10px); }
        }
      `}</style>
      
      {!isBuilderFlow && (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#E85A24] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">ע</span>
                </div>
                <div>
                  <span className="font-bold text-[#E85A24] text-xl">עתיד</span>
                  <span className="text-[#6B2D4A] text-sm block -mt-1">סקרים</span>
                </div>
              </div>
              
              <nav className="hidden md:flex items-center gap-6">
                <Link to={createPageUrl('Home')} className="text-gray-600 hover:text-[#E85A24] transition-colors flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  בית
                </Link>
                <Link to={createPageUrl('SurveyManagement')} className="text-gray-600 hover:text-[#E85A24] transition-colors flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  הסקרים שלי
                </Link>
                <Link to={createPageUrl('ResultsOverview')} className="text-gray-600 hover:text-[#E85A24] transition-colors flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  תוצאות
                </Link>
              </nav>
            </div>
          </div>
        </header>
      )}
      
      <main className={isBuilderFlow ? '' : 'pb-20 md:pb-0'}>
        {children}
      </main>
      
      {!isBuilderFlow && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
          <div className="flex items-center justify-around h-16">
            <Link to={createPageUrl('Home')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-[#E85A24]">
              <Home className="w-5 h-5" />
              <span className="text-xs">בית</span>
            </Link>
            <Link to={createPageUrl('SurveyManagement')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-[#E85A24]">
              <FileText className="w-5 h-5" />
              <span className="text-xs">סקרים</span>
            </Link>
            <Link to={createPageUrl('ResultsOverview')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-[#E85A24]">
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">תוצאות</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}