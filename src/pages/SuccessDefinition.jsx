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
  const [showCustom, setShowCustom] = useState(false);
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
            if (surveys[0].success_definition.type === 'custom') {
              setCustomText(surveys[0].success_definition.custom_text || '');
              setShowCustom(true);
            } else {
              setSelectedIdeas(surveys[0].success_definition.selected_ideas || []);
            }
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
      const successDef = showCustom 
        ? { type: 'custom', custom_text: customText }
        : { type: 'suggested', selected_ideas: selectedIdeas };
      
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
      const successDef = showCustom 
        ? { type: 'custom', custom_text: customText }
        : { type: 'suggested', selected_ideas: selectedIdeas };
      
      await base44.entities.Survey.update(surveyId, {
        success_definition: successDef,
        last_autosave: new Date().toISOString()
      });
      toast.success('הטיוטה נשמרה');
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
  };

  const isValid = showCustom ? customText.trim().length > 0 : selectedIdeas.length > 0;

  return (
    <StepWrapper
      currentStep={10}
      totalSteps={10}
      stepLabel="הגדרת הצלחה"
      title="מתי תדע שהפעילות הצליחה?"
      subtitle="בחר מהרעיונות או כתוב הגדרה משלך"
      onNext={handleNext}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      isNextDisabled={!isValid}
      isLoading={isLoading}
      nextLabel="לסיכום"
    >
      <div className="space-y-6">
        {/* Toggle between modes */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={!showCustom ? "default" : "outline"}
            onClick={() => setShowCustom(false)}
            className={!showCustom ? "bg-[#E85A24] hover:bg-[#D14A1A]" : ""}
          >
            <Sparkles className="w-4 h-4 ml-2" />
            בחירה מרעיונות
          </Button>
          <Button
            variant={showCustom ? "default" : "outline"}
            onClick={() => setShowCustom(true)}
            className={showCustom ? "bg-[#E85A24] hover:bg-[#D14A1A]" : ""}
          >
            <PenLine className="w-4 h-4 ml-2" />
            כתיבה חופשית
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {!showCustom ? (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {isGenerating ? (
                <div className="flex items-center justify-center py-12">
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
              
              {selectedIdeas.length > 0 && (
                <div className="mt-6 p-4 bg-orange-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-2">הגדרות הצלחה שנבחרו:</p>
                  <ul className="list-disc list-inside text-[#6B2D4A]">
                    {selectedIdeas.map((idea, idx) => (
                      <li key={idx}>{idea}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="custom"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="תאר במילים שלך מתי תדע שהפעילות הצליחה..."
                className="min-h-[150px] text-lg p-4 border-2 border-gray-200 rounded-xl focus:border-[#E85A24] resize-none"
                dir="rtl"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StepWrapper>
  );
}