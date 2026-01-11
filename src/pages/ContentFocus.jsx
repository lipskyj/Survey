import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import StepWrapper from '@/components/builder/StepWrapper';
import ChoiceCard from '@/components/builder/ChoiceCard';
import { toast } from 'sonner';
import { BookOpen, Heart, Settings, Users, Sparkles } from 'lucide-react';

const CONTENT_FOCUS_OPTIONS = [
  { 
    value: 'pedagogical', 
    label: 'לימודי-פדגוגי', 
    description: 'תכנים לימודיים, מיומנויות חשיבה, הישגים',
    icon: BookOpen 
  },
  { 
    value: 'social_emotional', 
    label: 'חברתי-רגשי', 
    description: 'מיומנויות חברתיות, בניית קשרים, רגשות',
    icon: Heart 
  },
  { 
    value: 'values', 
    label: 'ערכי', 
    description: 'ערכים, אזרחות, מעורבות חברתית',
    icon: Sparkles 
  },
  { 
    value: 'organizational', 
    label: 'ארגוני-לוגיסטי', 
    description: 'ארגון, לוגיסטיקה, תשתיות',
    icon: Settings 
  },
  { 
    value: 'community', 
    label: 'קהילתי', 
    description: 'שותפויות, מעורבות הורים, קהילה',
    icon: Users 
  },
];

export default function ContentFocus() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [surveyId, setSurveyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('surveyId');
    if (id) {
      setSurveyId(id);
      base44.entities.Survey.filter({ id }).then(surveys => {
        if (surveys.length > 0 && surveys[0].content_focus) {
          setSelected(surveys[0].content_focus);
        }
      });
    }
  }, []);

  const handleToggle = (value) => {
    setSelected(prev => {
      if (prev.includes(value)) {
        return prev.filter(v => v !== value);
      }
      if (prev.length >= 3) {
        toast.error('ניתן לבחור עד 3 תחומי מיקוד');
        return prev;
      }
      return [...prev, value];
    });
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await base44.entities.Survey.update(surveyId, {
        content_focus: selected,
        current_step: 'A9',
        last_autosave: new Date().toISOString()
      });
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('returnTo');
      if (returnTo) {
        navigate(createPageUrl(returnTo) + `?surveyId=${surveyId}`);
      } else {
        navigate(createPageUrl('MeasurementTargets') + `?surveyId=${surveyId}`);
      }
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
    setIsLoading(false);
  };

  const handleBack = () => {
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('returnTo');
    if (returnTo) {
      navigate(createPageUrl(returnTo) + `?surveyId=${surveyId}`);
    } else {
      navigate(createPageUrl('EventType') + `?surveyId=${surveyId}`);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await base44.entities.Survey.update(surveyId, {
        content_focus: selected,
        last_autosave: new Date().toISOString()
      });
      toast.success('הטיוטה נשמרה');
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
  };

  const isValid = selected.length >= 1 && selected.length <= 3;

  return (
    <StepWrapper
      currentStep={8}
      totalSteps={11}
      stepLabel="תחומי מיקוד"
      title="מה עיקר המיקוד של הפעילות?"
      subtitle="בחר 1-3 תחומים מרכזיים"
      onNext={handleNext}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      isNextDisabled={!isValid}
      isLoading={isLoading}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm ${
            selected.length >= 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            נבחרו {selected.length}/3
          </span>
          {selected.length === 0 && (
            <span className="text-sm text-amber-600">יש לבחור לפחות תחום אחד</span>
          )}
        </div>
        
        {CONTENT_FOCUS_OPTIONS.map((option) => (
          <ChoiceCard
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            icon={option.icon}
            isSelected={selected.includes(option.value)}
            onClick={handleToggle}
            isMulti={true}
          />
        ))}
      </div>
    </StepWrapper>
  );
}