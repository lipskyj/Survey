import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import StepWrapper from '@/components/builder/StepWrapper';
import ChoiceCard from '@/components/builder/ChoiceCard';
import { toast } from 'sonner';
import { TrendingUp, Target, MessageSquare, ClipboardCheck } from 'lucide-react';

const EVALUATION_GOALS = [
  { 
    value: 'improve_activity', 
    label: 'שיפור הפעילות', 
    description: 'לקבל משוב לצורך שיפור ועדכון',
    icon: TrendingUp 
  },
  { 
    value: 'measure_impact', 
    label: 'מדידת השפעה', 
    description: 'להבין את ההשפעה על המשתתפים',
    icon: Target 
  },
  { 
    value: 'stakeholder_feedback', 
    label: 'שיתוף בעלי עניין', 
    description: 'לשמוע את קולם של המשתתפים',
    icon: MessageSquare 
  },
  { 
    value: 'compliance', 
    label: 'עמידה בדרישות', 
    description: 'תיעוד ודיווח לגורמים שונים',
    icon: ClipboardCheck 
  },
];

export default function EvaluationGoal() {
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
        if (surveys.length > 0 && surveys[0].evaluation_goal) {
          setSelected(surveys[0].evaluation_goal);
        }
      });
    }
  }, []);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await base44.entities.Survey.update(surveyId, {
        evaluation_goal: selected,
        current_step: 'A7',
        last_autosave: new Date().toISOString()
      });
      navigate(createPageUrl('SuccessDefinition') + `?surveyId=${surveyId}`);
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
    setIsLoading(false);
  };

  const handleBack = () => {
    navigate(createPageUrl('ContentFocus') + `?surveyId=${surveyId}`);
  };

  const handleSaveDraft = async () => {
    try {
      await base44.entities.Survey.update(surveyId, {
        evaluation_goal: selected,
        last_autosave: new Date().toISOString()
      });
      toast.success('הטיוטה נשמרה');
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
  };

  return (
    <StepWrapper
      currentStep={6}
      totalSteps={7}
      stepLabel="מטרת ההערכה"
      title="מה המטרה המרכזית של הסקר?"
      subtitle="בחר את המטרה העיקרית"
      onNext={handleNext}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      isNextDisabled={!selected}
      isLoading={isLoading}
    >
      <div className="space-y-3">
        {EVALUATION_GOALS.map((goal) => (
          <ChoiceCard
            key={goal.value}
            value={goal.value}
            label={goal.label}
            description={goal.description}
            icon={goal.icon}
            isSelected={selected === goal.value}
            onClick={setSelected}
          />
        ))}
      </div>
    </StepWrapper>
  );
}