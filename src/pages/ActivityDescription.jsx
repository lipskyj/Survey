import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Textarea } from "@/components/ui/textarea";
import StepWrapper from '@/components/builder/StepWrapper';
import { toast } from 'sonner';

export default function ActivityDescription() {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [surveyId, setSurveyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for existing draft on mount
  useEffect(() => {
    const checkDraft = async () => {
      const params = new URLSearchParams(window.location.search);
      const existingId = params.get('surveyId');
      
      if (existingId) {
        const survey = await base44.entities.Survey.filter({ id: existingId });
        if (survey.length > 0) {
          setDescription(survey[0].activity_description || '');
          setSurveyId(existingId);
          toast.success('הטיוטה שוחזרה בהצלחה');
        }
      }
    };
    checkDraft();
  }, []);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      let id = surveyId;
      if (!surveyId) {
        const newSurvey = await base44.entities.Survey.create({
          activity_description: description,
          status: 'draft',
          current_step: 'A2',
          last_autosave: new Date().toISOString()
        });
        id = newSurvey.id;
      } else {
        await base44.entities.Survey.update(surveyId, {
          activity_description: description,
          current_step: 'A2',
          last_autosave: new Date().toISOString()
        });
      }
      navigate(createPageUrl('Audience') + `?surveyId=${id}`);
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
    setIsLoading(false);
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    try {
      if (surveyId) {
        await base44.entities.Survey.update(surveyId, {
          activity_description: description,
          last_autosave: new Date().toISOString()
        });
      } else {
        const newSurvey = await base44.entities.Survey.create({
          activity_description: description,
          status: 'draft',
          current_step: 'A1',
          last_autosave: new Date().toISOString()
        });
        setSurveyId(newSurvey.id);
        window.history.replaceState({}, '', createPageUrl('ActivityDescription') + `?surveyId=${newSurvey.id}`);
      }
      toast.success('הטיוטה נשמרה');
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
    setIsLoading(false);
  };

  return (
    <StepWrapper
      currentStep={1}
      totalSteps={7}
      stepLabel="תיאור הפעילות"
      title="מה הפעילות שתרצה לקבל עליה משוב?"
      subtitle="תאר בקצרה את הפעילות, התוכנית או האירוע"
      onNext={handleNext}
      onSaveDraft={handleSaveDraft}
      isNextDisabled={!description.trim()}
      isLoading={isLoading}
      showBack={false}
    >
      <div className="space-y-4">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="לדוגמה: תוכנית העשרה לכיתות ז׳ בנושא מנהיגות, הכוללת 6 מפגשים עם מנחה חיצוני..."
          className="min-h-[200px] text-lg p-4 border-2 border-gray-200 rounded-xl focus:border-[#E85A24] focus:ring-[#E85A24] resize-none"
          dir="rtl"
        />
        <p className="text-sm text-gray-400">
          ככל שהתיאור מפורט יותר, הסקר יהיה מדויק יותר
        </p>
      </div>
    </StepWrapper>
  );
}