import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import StepWrapper from '@/components/builder/StepWrapper';
import { toast } from 'sonner';
import { Languages } from 'lucide-react';

export default function SurveyLanguage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('hebrew');
  const [surveyId, setSurveyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('surveyId');
    if (id) {
      setSurveyId(id);
      base44.entities.Survey.filter({ id }).then(surveys => {
        if (surveys.length > 0 && surveys[0].language) {
          setLanguage(surveys[0].language);
        }
      });
    }
  }, []);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      let currentSurveyId = surveyId;
      
      if (!currentSurveyId) {
        // Create new survey
        const newSurvey = await base44.entities.Survey.create({
          status: 'draft',
          language: language,
          current_step: 'A0',
          last_autosave: new Date().toISOString()
        });
        currentSurveyId = newSurvey.id;
      } else {
        await base44.entities.Survey.update(currentSurveyId, {
          language: language,
          current_step: 'A0',
          last_autosave: new Date().toISOString()
        });
      }
      
      navigate(createPageUrl('ActivityDescription') + `?surveyId=${currentSurveyId}`);
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
    setIsLoading(false);
  };

  const handleSaveDraft = async () => {
    if (!surveyId) {
      toast.error('יש לבחור שפה ולהמשיך');
      return;
    }
    try {
      await base44.entities.Survey.update(surveyId, {
        language: language,
        last_autosave: new Date().toISOString()
      });
      toast.success('הטיוטה נשמרה');
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
  };

  return (
    <StepWrapper
      currentStep={1}
      totalSteps={12}
      stepLabel="שפת השאלון"
      title="באיזו שפה יהיה השאלון?"
      subtitle="בחר את השפה בה יוצגו השאלות למשיבים"
      onNext={handleNext}
      onSaveDraft={handleSaveDraft}
      isNextDisabled={false}
      isLoading={isLoading}
      showBack={false}
    >
      <div className="space-y-4">
        <label 
          className={`flex items-center gap-4 p-5 rounded-xl cursor-pointer transition-all ${language === 'hebrew' ? 'bg-[#E85A24]/10 border-2 border-[#E85A24]' : 'bg-white border-2 border-gray-200 hover:border-gray-300'}`}
          onClick={() => setLanguage('hebrew')}
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${language === 'hebrew' ? 'border-[#E85A24]' : 'border-gray-300'}`}>
            {language === 'hebrew' && <div className="w-3 h-3 rounded-full bg-[#E85A24]" />}
          </div>
          <div className="flex-1">
            <span className="font-semibold text-lg text-gray-800">עברית</span>
            <p className="text-gray-500 mt-1">השאלון יוצג בעברית</p>
          </div>
          <span className="text-2xl">🇮🇱</span>
        </label>
        
        <label 
          className={`flex items-center gap-4 p-5 rounded-xl cursor-pointer transition-all ${language === 'arabic' ? 'bg-[#E85A24]/10 border-2 border-[#E85A24]' : 'bg-white border-2 border-gray-200 hover:border-gray-300'}`}
          onClick={() => setLanguage('arabic')}
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${language === 'arabic' ? 'border-[#E85A24]' : 'border-gray-300'}`}>
            {language === 'arabic' && <div className="w-3 h-3 rounded-full bg-[#E85A24]" />}
          </div>
          <div className="flex-1">
            <span className="font-semibold text-lg text-gray-800">عربية</span>
            <p className="text-gray-500 mt-1">الاستبيان سيُعرض بالعربية</p>
          </div>
          <span className="text-2xl">🇮🇱</span>
        </label>
      </div>
    </StepWrapper>
  );
}