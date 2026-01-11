import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import StepWrapper from '@/components/builder/StepWrapper';
import ChoiceCard from '@/components/builder/ChoiceCard';
import { toast } from 'sonner';
import { Calendar, RefreshCw, CalendarDays, Rocket } from 'lucide-react';

const EVENT_TYPES = [
  { value: 'single_event', label: 'אירוע חד פעמי', description: 'פעילות או אירוע בודד', icon: Calendar },
  { value: 'ongoing_program', label: 'תוכנית מתמשכת', description: 'סדרת מפגשים או תוכנית שנתית', icon: RefreshCw },
  { value: 'annual_activity', label: 'פעילות שנתית קבועה', description: 'פעילות חוזרת מדי שנה', icon: CalendarDays },
  { value: 'special_project', label: 'פרויקט מיוחד', description: 'יוזמה או פרויקט ייחודי', icon: Rocket },
];

export default function EventType() {
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
        if (surveys.length > 0 && surveys[0].event_type) {
          setSelected(surveys[0].event_type);
        }
      });
    }
  }, []);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await base44.entities.Survey.update(surveyId, {
        event_type: selected,
        current_step: 'A8',
        last_autosave: new Date().toISOString()
      });
      navigate(createPageUrl('ContentFocus') + `?surveyId=${surveyId}`);
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
    setIsLoading(false);
  };

  const handleBack = () => {
    navigate(createPageUrl('MeasurementTargets') + `?surveyId=${surveyId}`);
  };

  const handleSaveDraft = async () => {
    try {
      await base44.entities.Survey.update(surveyId, {
        event_type: selected,
        last_autosave: new Date().toISOString()
      });
      toast.success('הטיוטה נשמרה');
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
  };

  return (
    <StepWrapper
      currentStep={7}
      totalSteps={10}
      stepLabel="סוג הפעילות"
      title="מהו אופי הפעילות?"
      subtitle="בחר את סוג האירוע או התוכנית"
      onNext={handleNext}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      isNextDisabled={!selected}
      isLoading={isLoading}
    >
      <div className="space-y-3">
        {EVENT_TYPES.map((eventType) => (
          <ChoiceCard
            key={eventType.value}
            value={eventType.value}
            label={eventType.label}
            description={eventType.description}
            icon={eventType.icon}
            isSelected={selected === eventType.value}
            onClick={setSelected}
          />
        ))}
      </div>
    </StepWrapper>
  );
}