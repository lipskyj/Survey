import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

async function publicApi(action, params = {}) {
  const res = await base44.functions.invoke('publicSurvey', { action, ...params });
  return res.data.data;
}
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, Lock, FileX, ClipboardCheck } from 'lucide-react';

export default function RespondIntro() {
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const loadSurvey = async () => {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get('s');
      
      if (!slug) {
        setError('not_found');
        setIsLoading(false);
        return;
      }

      try {
        const surveys = await publicApi('getSurveyBySlug', { slug });
        
        if (surveys.length === 0) {
          setError('not_found');
        } else if (surveys[0].status === 'draft') {
          setError('not_published');
        } else if (surveys[0].status === 'closed') {
          setError('closed');
          setSurvey(surveys[0]);
        } else {
          setSurvey(surveys[0]);
          // Generate unique session ID for each response (allows multiple responses from same device)
          const newSessionId = `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 4)}`;
          setSessionId(newSessionId);
        }
      } catch (err) {
        setError('error');
      }
      
      setIsLoading(false);
    };
    
    loadSurvey();
  }, []);

  const handleStart = async () => {
    // Create response record
    try {
      const response = await publicApi('createResponse', { data: {
        survey_id: survey.id,
        session_id: sessionId,
        started_at: new Date().toISOString(),
        answers: [],
        is_complete: false
      });
      
      navigate(createPageUrl('RespondQuestion') + `?s=${survey.share_slug}&r=${response.id}&q=0`);
    } catch (err) {
      console.error('Error creating response:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#E85A24] animate-spin" />
      </div>
    );
  }

  // Error states
  if (error === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileX className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">הסקר לא נמצא</h1>
          <p className="text-gray-500">הקישור שהזנת אינו תקין או שהסקר נמחק</p>
        </div>
      </div>
    );
  }

  if (error === 'not_published') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">הסקר עדיין לא פורסם</h1>
          <p className="text-gray-500">הסקר בהכנה ויפורסם בקרוב</p>
        </div>
      </div>
    );
  }

  if (error === 'closed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClipboardCheck className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">הסקר נסגר</h1>
          <p className="text-gray-500">תודה על ההתעניינות, איסוף התשובות הסתיים</p>
          {survey?.responses_count > 0 && (
            <p className="text-sm text-gray-400 mt-4">נאספו {survey.responses_count} תגובות</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          {/* Logo */}
          <div className="w-16 h-16 bg-[#E85A24] rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-white font-bold text-2xl">ע</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-[#6B2D4A] mb-6">
            סקר משוב
          </h1>

          {/* Intro Text */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">
              {survey?.intro_text || 'נשמח לשמוע את דעתך! הסקר קצר ואנונימי.'}
            </p>
          </div>

          {/* Privacy Note */}
          <div className={`${survey?.is_anonymous !== false ? 'bg-green-50' : 'bg-blue-50'} rounded-xl p-4 mb-8`}>
            <div className="flex items-center gap-3">
              <Lock className={`w-5 h-5 ${survey?.is_anonymous !== false ? 'text-green-600' : 'text-blue-600'} flex-shrink-0`} />
              <p className={`text-sm ${survey?.is_anonymous !== false ? 'text-green-800' : 'text-blue-800'} text-right`}>
                {survey?.is_anonymous !== false
                  ? 'התשובות אנונימיות ומשמשות לשיפור בלבד'
                  : 'סקר זה הוא נוכחות שמית — התשובות ישמרו עם שמך'}
              </p>
            </div>
          </div>

          {/* Start Button */}
          <Button
            onClick={handleStart}
            className="w-full py-6 bg-[#E85A24] hover:bg-[#D14A1A] text-white text-lg font-medium rounded-xl shadow-lg shadow-orange-200"
          >
            התחל למלא
            <ChevronLeft className="w-5 h-5 mr-2" />
          </Button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center">
        <p className="text-xs text-gray-400">
          מופעל על ידי עתיד סקרים
        </p>
      </div>
    </div>
  );
}