import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import StepWrapper from '@/components/builder/StepWrapper';
import ChoiceCard from '@/components/builder/ChoiceCard';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from 'framer-motion';

import { Checkbox } from "@/components/ui/checkbox";

const GRADE_OPTIONS = [
  { value: 'middle', label: 'חטיבת ביניים (ז׳-ט׳)' },
  { value: 'high', label: 'תיכון (י׳-י״ב)' },
  { value: 'college', label: 'מכללה (י״ג-י״ד)' },
];

export default function GradeRange() {
  const navigate = useNavigate();
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [surveyId, setSurveyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('surveyId');
    if (id) {
      setSurveyId(id);
      base44.entities.Survey.filter({ id }).then(surveys => {
        if (surveys.length > 0 && surveys[0].grade_range?.selected_grades) {
          setSelectedGrades(surveys[0].grade_range.selected_grades);
        }
      });
    }
  }, []);

  const toggleGrade = (value) => {
    setSelectedGrades(prev => 
      prev.includes(value) 
        ? prev.filter(g => g !== value)
        : [...prev, value]
    );
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await base44.entities.Survey.update(surveyId, {
        grade_range: { selected_grades: selectedGrades },
        current_step: 'A4',
        last_autosave: new Date().toISOString()
      });
      navigate(createPageUrl('EventType') + `?surveyId=${surveyId}`);
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
    setIsLoading(false);
  };

  const handleBack = () => {
    navigate(createPageUrl('Audience') + `?surveyId=${surveyId}`);
  };

  const handleSaveDraft = async () => {
    try {
      await base44.entities.Survey.update(surveyId, {
        grade_range: { selected_grades: selectedGrades },
        last_autosave: new Date().toISOString()
      });
      toast.success('הטיוטה נשמרה');
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
  };

  const isValid = selectedGrades.length > 0;

  return (
    <StepWrapper
      currentStep={3}
      totalSteps={7}
      stepLabel="שכבות גיל"
      title="לאיזה שכבות גיל מיועדת הפעילות?"
      subtitle="ניתן לבחור יותר מאפשרות אחת"
      onNext={handleNext}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      isNextDisabled={!isValid}
      isLoading={isLoading}
    >
      <div className="space-y-3">
        {GRADE_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedGrades.includes(option.value)
                ? 'border-[#E85A24] bg-[#E85A24]/5'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <Checkbox
              checked={selectedGrades.includes(option.value)}
              onCheckedChange={() => toggleGrade(option.value)}
              className="w-5 h-5"
            />
            <span className={`font-medium text-lg ${selectedGrades.includes(option.value) ? 'text-[#E85A24]' : 'text-gray-700'}`}>
              {option.label}
            </span>
          </label>
        ))}
        
        {selectedGrades.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50 rounded-xl p-4 mt-4"
          >
            <p className="text-sm text-gray-600">
              <span className="font-medium">נבחרו:</span>{' '}
              {selectedGrades.map(g => GRADE_OPTIONS.find(o => o.value === g)?.label).join(', ')}
            </p>
          </motion.div>
        )}
      </div>
    </StepWrapper>
  );
}