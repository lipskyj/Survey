import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import StepWrapper from '@/components/builder/StepWrapper';
import DraggableChip from '@/components/builder/DraggableChip';
import { toast } from 'sonner';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, PenLine } from 'lucide-react';

export default function SuccessDefinition() {
  const navigate = useNavigate();
  const [selectedIdeas, setSelectedIdeas] = useState([]);
  const [customText, setCustomText] = useState('');
  const [surveyId, setSurveyId] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [suggestedIdeas, setSuggestedIdeas] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('surveyId');
      if (id) {
        setSurveyId(id);
        const surveys = await base44.entities.Survey.filter({ id });
        if (surveys.length > 0) {
          setSurvey(surveys[0]);
          if (surveys[0].success_definition) {
            setCustomText(surveys[0].success_definition.custom_text || '');
            setSelectedIdeas(surveys[0].success_definition.selected_ideas || []);
          }
          generateSuggestions(surveys[0]);
        }
      }
    };
    loadData();
  }, []);

  const generateSuggestions = async (surveyData) => {
    setIsGenerating(true);
    try {
      const focusText = surveyData.content_focus?.join(', ') || '';
      const audienceText = surveyData.audience || '';
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `בהתבסס על פעילות חינוכית עם המאפיינים הבאים:
- תיאור: ${surveyData.activity_description || 'לא צוין'}
- קהל יעד: ${audienceText}
- תחומי מיקוד: ${focusText}

צור 5 הגדרות הצלחה קצרות ומדידות לפעילות זו בעברית.
כל הגדרה צריכה להיות משפט קצר (עד 10 מילים) שמתאר מה יחשב להצלחה.`,
        response_json_schema: {
          type: "object",
          properties: {
            ideas: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });
      
      setSuggestedIdeas(response.ideas || []);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestedIdeas([
        'המשתתפים ירגישו שהפעילות הייתה משמעותית',
        'יהיה שיפור במיומנויות הנלמדות',
        'המשתתפים ימליצו לאחרים להשתתף',
        'יהיה שינוי חיובי בהתנהגות',
        'המשתתפים יביעו שביעות רצון גבוהה'
      ]);
    }
    setIsGenerating(false);
  };

  const toggleIdea = (idea) => {
    setSelectedIdeas(prev => 
      prev.includes(idea) 
        ? prev.filter(i => i !== idea)
        : [...prev, idea]
    );
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      const successDef = {
        type: (selectedIdeas.length > 0 && customText.trim()) ? 'combined' : (customText.trim() ? 'custom' : 'suggested'),
        selected_ideas: selectedIdeas,
        custom_text: customText.trim()
      };
      
      await base44.entities.Survey.update(surveyId, {
        success_definition: successDef,
        current_step: 'B1',
        last_autosave: new Date().toISOString()
      });
      navigate(createPageUrl('ProfileSummary') + `?surveyId=${surveyId}`);
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
    setIsLoading(false);
  };

  const handleBack = () => {
    navigate(createPageUrl('EvaluationGoal') + `?surveyId=${surveyId}`);
  };

  const handleSaveDraft = async () => {
    try {
      const successDef = {
        type: (selectedIdeas.length > 0 && customText.trim()) ? 'combined' : (customText.trim() ? 'custom' : 'suggested'),
        selected_ideas: selectedIdeas,
        custom_text: customText.trim()
      };
      
      await base44.entities.Survey.update(surveyId, {
        success_definition: successDef,
        last_autosave: new Date().toISOString()
      });
      toast.success('הטיוטה נשמרה');
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
  };

  const isValid = selectedIdeas.length > 0 || customText.trim().length > 0;

  return (
    <StepWrapper
      currentStep={11}
      totalSteps={11}
      stepLabel="הגדרת הצלחה"
      title="מתי תדע שהפעילות הצליחה?"
      subtitle="בחר מהרעיונות והוסף הגדרה משלך"
      onNext={handleNext}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      isNextDisabled={!isValid}
      isLoading={isLoading}
      nextLabel="לסיכום"
    >
      <div className="space-y-6">
        {/* Suggested Ideas */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-[#E85A24]" />
            <h4 className="font-semibold text-gray-800">בחר מהרעיונות</h4>
          </div>
          
          {isGenerating ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-[#E85A24] animate-spin" />
              <span className="mr-3 text-gray-500">מייצר רעיונות...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {suggestedIdeas.map((idea, index) => (
                <DraggableChip
                  key={index}
                  label={idea}
                  isSelected={selectedIdeas.includes(idea)}
                  onToggle={() => toggleIdea(idea)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Custom Input */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <PenLine className="w-5 h-5 text-[#E85A24]" />
            <h4 className="font-semibold text-gray-800">הוסף הגדרה משלך</h4>
          </div>
          <Textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="תאר במילים שלך מתי תדע שהפעילות הצליחה..."
            className="min-h-[100px] text-lg p-4 border-2 border-gray-200 rounded-xl focus:border-[#E85A24] resize-none"
            dir="rtl"
          />
        </div>
        
        {/* Summary */}
        {(selectedIdeas.length > 0 || customText.trim()) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-orange-50 rounded-xl"
          >
            <p className="text-sm text-gray-600 mb-2">מדדי הצלחה שנבחרו:</p>
            <ul className="list-disc list-inside text-[#6B2D4A] space-y-1">
              {selectedIdeas.map((idea, idx) => (
                <li key={idx}>{idea}</li>
              ))}
              {customText.trim() && <li>{customText}</li>}
            </ul>
          </motion.div>
        )}
      </div>
    </StepWrapper>
  );
}