import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import StepWrapper from '@/components/builder/StepWrapper';
import ChoiceCard from '@/components/builder/ChoiceCard';
import { toast } from 'sonner';
import { GraduationCap, Users, Briefcase, Building } from 'lucide-react';

const AUDIENCES = [
  { value: 'students', label: 'תלמידים', description: 'משוב מהתלמידים שהשתתפו', icon: GraduationCap },
  { value: 'parents', label: 'הורים', description: 'משוב מההורים', icon: Users },
  { value: 'teachers', label: 'מורים', description: 'משוב מצוות ההוראה', icon: Briefcase },
  { value: 'management', label: 'הנהלה', description: 'משוב מצוות ההנהלה', icon: Building },
];

export default function Audience() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');
  const [surveyId, setSurveyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('surveyId');
    if (id) {
      setSurveyId(id);
      base44.entities.Survey.filter({ id }).then(surveys => {
        if (surveys.length > 0 && surveys[0].audience) {
          setSelected(surveys[0].audience);
        }
      });
    }
  }, []);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await base44.entities.Survey.update(surveyId, {
        audience: selected,
        current_step: 'A3',
        last_autosave: new Date().toISOString()
      });
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('returnTo');
      if (returnTo) {
        navigate(createPageUrl(returnTo) + `?surveyId=${surveyId}`);
      } else {
        navigate(createPageUrl('GradeRange') + `?surveyId=${surveyId}`);
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
      navigate(createPageUrl('ActivityDescription') + `?surveyId=${surveyId}`);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await base44.entities.Survey.update(surveyId, {
        audience: selected,
        last_autosave: new Date().toISOString()
      });
      toast.success('הטיוטה נשמרה');
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
  };

  return (
    <StepWrapper
      currentStep={2}
      totalSteps={11}
      stepLabel="קהל היעד"
      title="ממי נאסוף את המשוב?"
      subtitle="בחר את קהל היעד המרכזי לסקר"
      onNext={handleNext}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      isNextDisabled={!selected}
      isLoading={isLoading}
    >
      <div className="space-y-3">
        {AUDIENCES.map((audience) => (
          <ChoiceCard
            key={audience.value}
            value={audience.value}
            label={audience.label}
            description={audience.description}
            icon={audience.icon}
            isSelected={selected === audience.value}
            onClick={setSelected}
          />
        ))}
      </div>
    </StepWrapper>
  );
}