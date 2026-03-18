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
      
      // Map audience to Hebrew
      const audienceMap = {
        students: 'תלמידים',
        teachers: 'מורים',
        parents: 'הורים',
        management: 'הנהלה'
      };
      const hebrewAudience = audienceMap[audienceText] || audienceText;
      
      // Build audience-specific prompts
      const audienceContext = {
        students: 'התלמידים ירחיבו ידע, ישתפו בחוויה חיובית, יפתחו מיומנויות, ירגישו שייכות',
        teachers: 'המורים ישפרו איכות הוראה, יקבלו כלים יישומיים, יראו השפעה על תלמידים',
        parents: 'ההורים יבינו תרומה לילדים, ירגישו שותפות, יקבלו תובנות חשובות',
        management: 'ההנהלה תקבל החלטות מבוססות נתונים, תראה ROI, תזהה שיפורים מערכתיים'
      };
      
      const audienceStartWord = { students: 'התלמידים', teachers: 'המורים', parents: 'ההורים', management: 'ההנהלה' };
      const startWord = audienceStartWord[audienceText] || hebrewAudience;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `אתה יוצר הגדרות הצלחה לפעילות חינוכית.

🔒 AUDIENCE = ${hebrewAudience} בלבד. אסור בהחלט להזכיר קהל אחר!

⛔ אסור: כל הגדרה שמתחילה במילה שאינה "${startWord}"
✅ חובה: כל אחת מ-5 ההגדרות חייבת להתחיל בדיוק במילה "${startWord}"

פרטי הפעילות:
- תיאור: ${surveyData.activity_description || 'לא צוין'}
- קהל יעד: ${hebrewAudience}
- תחומי מיקוד: ${focusText}

רקע: ${audienceContext[audienceText] || ''}

צור 5 הגדרות הצלחה קצרות (עד 12 מילים כל אחת), כולן מתחילות ב-"${startWord}".`,
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
      
      // Audience-specific fallback ideas
      const fallbackMap = {
        students: [
          'התלמידים ירחיבו את הידע שלהם על הנושא',
          'התלמידים ירגישו שהפעילות הייתה משמעותית',
          'התלמידים יפתחו מיומנויות חדשות',
          'התלמידים ירגישו שייכות לקבוצה',
          'התלמידים ימליצו לחברים להשתתף'
        ],
        teachers: [
          'המורים יישמו שיטות חדשות בכיתה',
          'המורים יזהו שיפור בהשתתפות התלמידים',
          'המורים ירגישו שהפעילות תרמה לתלמידים',
          'המורים יקבלו כלים מעשיים ליישום',
          'המורים ימליצו להמשיך את הפעילות'
        ],
        parents: [
          'ההורים יבינו את התרומה לילדים',
          'ההורים ירגישו שותפות בתהליך החינוכי',
          'ההורים יקבלו תובנות על התפתחות ילדיהם',
          'ההורים ירצו להמשיך בפעילויות דומות',
          'ההורים ירגישו ביטחון בבית הספר'
        ],
        management: [
          'ההנהלה תקבל נתונים לקבלת החלטות',
          'ההנהלה תזהה שיפורים מערכתיים',
          'ההנהלה תבין את ההשפעה על התלמידים',
          'ההנהלה תחליט על המשך הפעילות',
          'ההנהלה תראה ערך מוסף למשאבים'
        ]
      };
      
      setSuggestedIdeas(fallbackMap[surveyData.audience] || fallbackMap.students);
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
      navigate(createPageUrl('SurveyLength') + `?surveyId=${surveyId}`);
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
      navigate(createPageUrl('EvaluationGoal') + `?surveyId=${surveyId}`);
    }
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