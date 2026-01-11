import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import StepWrapper from '@/components/builder/StepWrapper';
import { toast } from 'sonner';
import { Info } from 'lucide-react';

export default function SurveyType() {
  const navigate = useNavigate();
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [surveyId, setSurveyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('surveyId');
    if (id) {
      setSurveyId(id);
      base44.entities.Survey.filter({ id }).then(surveys => {
        if (surveys.length > 0 && typeof surveys[0].is_anonymous === 'boolean') {
          setIsAnonymous(surveys[0].is_anonymous);
        }
      });
    }
  }, []);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await base44.entities.Survey.update(surveyId, {
        is_anonymous: isAnonymous,
        current_step: 'A4',
        last_autosave: new Date().toISOString()
      });
      navigate(createPageUrl('BackgroundQuestions') + `?surveyId=${surveyId}`);
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
    setIsLoading(false);
  };

  const handleBack = () => {
    navigate(createPageUrl('GradeRange') + `?surveyId=${surveyId}`);
  };

  const handleSaveDraft = async () => {
    try {
      await base44.entities.Survey.update(surveyId, {
        is_anonymous: isAnonymous,
        last_autosave: new Date().toISOString()
      });
      toast.success('הטיוטה נשמרה');
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
  };

  return (
    <StepWrapper
      currentStep={4}
      totalSteps={10}
      stepLabel="סוג השאלון"
      title="האם השאלון יהיה אנונימי או שמי?"
      subtitle="בחר את סוג השאלון המתאים לך"
      onNext={handleNext}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      isNextDisabled={false}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        <label 
          className={`flex items-start gap-4 p-5 rounded-xl cursor-pointer transition-all ${isAnonymous ? 'bg-[#E85A24]/10 border-2 border-[#E85A24]' : 'bg-white border-2 border-gray-200 hover:border-gray-300'}`}
          onClick={() => setIsAnonymous(true)}
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${isAnonymous ? 'border-[#E85A24]' : 'border-gray-300'}`}>
            {isAnonymous && <div className="w-3 h-3 rounded-full bg-[#E85A24]" />}
          </div>
          <div>
            <span className="font-semibold text-lg text-gray-800">שאלון אנונימי</span>
            <p className="text-gray-500 mt-1">לא ניתן לזהות מי ענה על השאלון. מעודד מענה כנה ופתוח יותר.</p>
          </div>
        </label>
        
        <label 
          className={`flex items-start gap-4 p-5 rounded-xl cursor-pointer transition-all ${!isAnonymous ? 'bg-[#E85A24]/10 border-2 border-[#E85A24]' : 'bg-white border-2 border-gray-200 hover:border-gray-300'}`}
          onClick={() => setIsAnonymous(false)}
        >
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${!isAnonymous ? 'border-[#E85A24]' : 'border-gray-300'}`}>
            {!isAnonymous && <div className="w-3 h-3 rounded-full bg-[#E85A24]" />}
          </div>
          <div>
            <span className="font-semibold text-lg text-gray-800">שאלון שמי</span>
            <p className="text-gray-500 mt-1">ניתן לזהות מי ענה על השאלון. מאפשר מעקב אישי.</p>
          </div>
        </label>
        
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl mt-6">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">
            {isAnonymous 
              ? 'שאלון אנונימי מאפשר לעונים להרגיש חופשיים לענות בכנות, מה שמוביל לתשובות אמינות יותר.'
              : 'שאלון שמי מאפשר מעקב אישי, אך עלול לגרום לעונים לענות מה שנראה להם "נכון" ולא מה שהם באמת חושבים.'}
          </p>
        </div>
      </div>
    </StepWrapper>
  );
}