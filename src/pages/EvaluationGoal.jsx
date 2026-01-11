import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import StepWrapper from '@/components/builder/StepWrapper';
import { toast } from 'sonner';
import { TrendingUp, Target, MessageSquare, ClipboardCheck, Check } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

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
  const [selected, setSelected] = useState([]);
  const [surveyId, setSurveyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('surveyId');
    if (id) {
      setSurveyId(id);
      base44.entities.Survey.filter({ id }).then(surveys => {
        if (surveys.length > 0 && surveys[0].evaluation_goal) {
          // Handle both old string format and new array format
          const goals = surveys[0].evaluation_goal;
          if (Array.isArray(goals)) {
            setSelected(goals);
          } else if (typeof goals === 'string') {
            setSelected([goals]);
          }
        }
      });
    }
  }, []);

  const toggleGoal = (value) => {
    setSelected(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await base44.entities.Survey.update(surveyId, {
        evaluation_goal: selected,
        current_step: 'A10',
        last_autosave: new Date().toISOString()
      });
      navigate(createPageUrl('SuccessDefinition') + `?surveyId=${surveyId}`);
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
      currentStep={10}
      totalSteps={11}
      stepLabel="מטרות הסקר"
      title="מה המטרות של הסקר?"
      subtitle="ניתן לבחור יותר ממטרה אחת"
      onNext={handleNext}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      isNextDisabled={selected.length === 0}
      isLoading={isLoading}
    >
      <div className="space-y-3">
        {EVALUATION_GOALS.map((goal) => {
          const Icon = goal.icon;
          const isSelected = selected.includes(goal.value);
          return (
            <label 
              key={goal.value}
              className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-[#E85A24]/10 border-2 border-[#E85A24]' 
                  : 'bg-white border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleGoal(goal.value)}
                className="w-5 h-5"
              />
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isSelected ? 'bg-[#E85A24]/10 text-[#E85A24]' : 'bg-gray-100 text-gray-500'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-800">{goal.label}</span>
                <p className="text-sm text-gray-500">{goal.description}</p>
              </div>
            </label>
          );
        })}
      </div>
    </StepWrapper>
  );
}