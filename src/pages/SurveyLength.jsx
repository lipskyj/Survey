import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import StepWrapper from '@/components/builder/StepWrapper';
import { toast } from 'sonner';

const OPTIONS = [
  { value: '5', label: '5 שאלות', description: 'קצר ותמציתי — מתאים לאירועים קצרים' },
  { value: '10', label: 'עד 10 שאלות', description: 'מאוזן — הסטנדרט המומלץ' },
  { value: '15', label: 'עד 15 שאלות', description: 'מעמיק — מתאים לתוכניות ארוכות' },
  { value: '15plus', label: 'יותר מ-15 שאלות', description: 'מקיף — לפעילויות מורכבות' },
];

export default function SurveyLength() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('10');
  const [surveyId, setSurveyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('surveyId');
    if (id) {
      setSurveyId(id);
      base44.entities.Survey.filter({ id }).then(surveys => {
        if (surveys.length > 0 && surveys[0].questions_count) {
          setSelected(surveys[0].questions_count);
        }
      });
    }
  }, []);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await base44.entities.Survey.update(surveyId, {
        questions_count: selected,
        current_step: 'A12',
        last_autosave: new Date().toISOString()
      });
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('returnTo');
      if (returnTo) {
        navigate(createPageUrl(returnTo) + `?surveyId=${surveyId}`);
      } else {
        navigate(createPageUrl('ProfileSummary') + `?surveyId=${surveyId}`);
      }
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
    setIsLoading(false);
  };

  const handleBack = () => {
    navigate(createPageUrl('SuccessDefinition') + `?surveyId=${surveyId}`);
  };

  const handleSaveDraft = async () => {
    try {
      await base44.entities.Survey.update(surveyId, {
        questions_count: selected,
        last_autosave: new Date().toISOString()
      });
      toast.success('הטיוטה נשמרה');
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
  };

  return (
    <StepWrapper
      currentStep={12}
      totalSteps={12}
      stepLabel="אורך השאלון"
      title="כמה שאלות תרצה שיכלול השאלון?"
      subtitle="מספר שאלות הדירוג שיופיעו בסקר"
      onNext={handleNext}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      isLoading={isLoading}
      nextLabel="לסיכום"
    >
      <div className="space-y-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-right transition-all ${
              selected === opt.value
                ? 'bg-[#E85A24]/10 border-[#E85A24]'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
              selected === opt.value ? 'border-[#E85A24]' : 'border-gray-300'
            }`}>
              {selected === opt.value && (
                <div className="w-3 h-3 rounded-full bg-[#E85A24]" />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-semibold text-lg ${selected === opt.value ? 'text-[#E85A24]' : 'text-gray-800'}`}>
                {opt.label}
              </p>
              <p className="text-sm text-gray-500">{opt.description}</p>
            </div>
          </button>
        ))}
      </div>
    </StepWrapper>
  );
}