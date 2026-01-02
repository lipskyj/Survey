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

const GRADE_PRESETS = [
  { value: 'elementary_low', label: 'כיתות א׳-ב׳', range: [1, 2] },
  { value: 'elementary_mid', label: 'כיתות ג׳-ד׳', range: [3, 4] },
  { value: 'elementary_high', label: 'כיתות ה׳-ו׳', range: [5, 6] },
  { value: 'middle', label: 'חטיבת ביניים (ז׳-ט׳)', range: [7, 9] },
  { value: 'high', label: 'תיכון (י׳-י״ב)', range: [10, 12] },
  { value: 'custom', label: 'טווח מותאם אישית', range: null },
];

export default function GradeRange() {
  const navigate = useNavigate();
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customFrom, setCustomFrom] = useState(1);
  const [customTo, setCustomTo] = useState(12);
  const [surveyId, setSurveyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('surveyId');
    if (id) {
      setSurveyId(id);
      base44.entities.Survey.filter({ id }).then(surveys => {
        if (surveys.length > 0 && surveys[0].grade_range) {
          const gr = surveys[0].grade_range;
          if (gr.type === 'custom') {
            setSelectedPreset('custom');
            setCustomFrom(gr.from_grade || 1);
            setCustomTo(gr.to_grade || 12);
          } else {
            setSelectedPreset(gr.preset || '');
          }
        }
      });
    }
  }, []);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      const gradeRange = selectedPreset === 'custom' 
        ? { type: 'custom', from_grade: customFrom, to_grade: customTo }
        : { type: 'preset', preset: selectedPreset };
      
      await base44.entities.Survey.update(surveyId, {
        grade_range: gradeRange,
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
      const gradeRange = selectedPreset === 'custom' 
        ? { type: 'custom', from_grade: customFrom, to_grade: customTo }
        : { type: 'preset', preset: selectedPreset };
      
      await base44.entities.Survey.update(surveyId, {
        grade_range: gradeRange,
        last_autosave: new Date().toISOString()
      });
      toast.success('הטיוטה נשמרה');
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
  };

  const isValid = selectedPreset && (selectedPreset !== 'custom' || (customFrom <= customTo));

  return (
    <StepWrapper
      currentStep={3}
      totalSteps={7}
      stepLabel="שכבות גיל"
      title="לאיזה שכבות גיל מיועדת הפעילות?"
      subtitle="בחר טווח כיתות או הגדר טווח מותאם"
      onNext={handleNext}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      isNextDisabled={!isValid}
      isLoading={isLoading}
    >
      <div className="space-y-3">
        {GRADE_PRESETS.map((preset) => (
          <ChoiceCard
            key={preset.value}
            value={preset.value}
            label={preset.label}
            isSelected={selectedPreset === preset.value}
            onClick={setSelectedPreset}
          />
        ))}
        
        <AnimatePresence>
          {selectedPreset === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-orange-50 rounded-xl p-4 mt-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-sm text-gray-600 mb-1 block">מכיתה</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={customFrom}
                    onChange={(e) => setCustomFrom(parseInt(e.target.value) || 1)}
                    className="text-center text-lg"
                  />
                </div>
                <span className="text-gray-400 mt-6">עד</span>
                <div className="flex-1">
                  <Label className="text-sm text-gray-600 mb-1 block">לכיתה</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={customTo}
                    onChange={(e) => setCustomTo(parseInt(e.target.value) || 12)}
                    className="text-center text-lg"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StepWrapper>
  );
}