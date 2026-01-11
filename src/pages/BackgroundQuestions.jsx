import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import StepWrapper from '@/components/builder/StepWrapper';
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox";

export default function BackgroundQuestions() {
  const navigate = useNavigate();
  const [surveyId, setSurveyId] = useState(null);
  const [audience, setAudience] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundQuestions, setBackgroundQuestions] = useState({
    include_class: false,
    include_gender: false,
    include_subject: false,
    include_role: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('surveyId');
    if (id) {
      setSurveyId(id);
      base44.entities.Survey.filter({ id }).then(surveys => {
        if (surveys.length > 0) {
          setAudience(surveys[0].audience || '');
          if (surveys[0].background_questions) {
            setBackgroundQuestions(surveys[0].background_questions);
          }
        }
      });
    }
  }, []);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await base44.entities.Survey.update(surveyId, {
        background_questions: backgroundQuestions,
        current_step: 'A5',
        last_autosave: new Date().toISOString()
      });
      navigate(createPageUrl('EventType') + `?surveyId=${surveyId}`);
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
    setIsLoading(false);
  };

  const handleBack = () => {
    navigate(createPageUrl('SurveyType') + `?surveyId=${surveyId}`);
  };

  const handleSaveDraft = async () => {
    try {
      await base44.entities.Survey.update(surveyId, {
        background_questions: backgroundQuestions,
        last_autosave: new Date().toISOString()
      });
      toast.success('הטיוטה נשמרה');
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
  };

  const toggleQuestion = (key) => {
    setBackgroundQuestions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getBackgroundOptions = () => {
    switch (audience) {
      case 'students':
        return [
          { key: 'include_class', label: 'שאלת כיתה', description: 'מאיזו כיתה התלמיד/ה' },
          { key: 'include_gender', label: 'שאלת מגדר', description: 'מגדר התלמיד/ה' },
        ];
      case 'teachers':
        return [
          { key: 'include_subject', label: 'שאלת מקצוע', description: 'מה המקצוע שהמורה מלמד/ת' },
        ];
      case 'parents':
        return [
          { key: 'include_class', label: 'שאלת כיתה', description: 'באיזו כיתה הילד/ה' },
        ];
      case 'management':
        return [
          { key: 'include_role', label: 'שאלת תפקיד', description: 'מה התפקיד בהנהלה' },
        ];
      default:
        return [];
    }
  };

  const backgroundOptions = getBackgroundOptions();

  return (
    <StepWrapper
      currentStep={5}
      totalSteps={10}
      stepLabel="שאלות רקע"
      title="שאלות רקע אופציונליות"
      subtitle="בחר אילו שאלות רקע להוסיף לשאלון"
      onNext={handleNext}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      isNextDisabled={false}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {backgroundOptions.length > 0 ? (
          backgroundOptions.map((option) => (
            <label 
              key={option.key}
              className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                backgroundQuestions[option.key] 
                  ? 'bg-[#E85A24]/10 border-2 border-[#E85A24]' 
                  : 'bg-white border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Checkbox
                checked={backgroundQuestions[option.key]}
                onCheckedChange={() => toggleQuestion(option.key)}
                className="w-5 h-5"
              />
              <div className="flex-1">
                <span className="font-medium text-gray-800">{option.label}</span>
                <p className="text-sm text-gray-500">{option.description}</p>
              </div>
            </label>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>יש לבחור קהל יעד תחילה</p>
          </div>
        )}
        
        <p className="text-sm text-gray-400 mt-4">
          שאלות אלו יופיעו בתחילת השאלון ויעזרו לפלח את התוצאות
        </p>
      </div>
    </StepWrapper>
  );
}