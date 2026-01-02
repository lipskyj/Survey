import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

// KIT domain mapping based on content focus
const KIT_MAPPING = {
  pedagogical: ['relevance', 'skills', 'delivery_quality'],
  social_emotional: ['belonging', 'relevance', 'delivery_quality'],
  values: ['belonging', 'relevance'],
  organizational: ['relevance', 'delivery_quality'],
  community: ['belonging', 'relevance']
};

export default function GenerateSurvey() {
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [surveyId, setSurveyId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const generationSteps = [
    'מנתח את הפעילות...',
    'בוחר תחומי מדידה (KIT)...',
    'יוצר שאלות סולם...',
    'יוצר שאלות פתוחות...',
    'מסיים את הסקר...'
  ];

  useEffect(() => {
    const loadSurvey = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('surveyId');
      if (id) {
        setSurveyId(id);
        const surveys = await base44.entities.Survey.filter({ id });
        if (surveys.length > 0) {
          setSurvey(surveys[0]);
        }
      }
    };
    loadSurvey();
  }, []);

  const generateQuestions = async () => {
    setIsGenerating(true);
    setGenerationStep(0);

    try {
      // Step 1: Analyze
      setGenerationStep(1);
      await new Promise(r => setTimeout(r, 800));

      // Get KIT domains based on content focus
      const contentFocuses = survey.content_focus || ['pedagogical'];
      const kitDomains = [...new Set(contentFocuses.flatMap(cf => KIT_MAPPING[cf] || []))];

      // Step 2: Select domains
      setGenerationStep(2);
      await new Promise(r => setTimeout(r, 600));

      // Step 3: Generate scale questions
      setGenerationStep(3);
      
      const scaleQuestionsPrompt = `צור 5-7 שאלות סקר בסולם 1-5 עבור פעילות חינוכית.
פרטי הפעילות:
- תיאור: ${survey.activity_description}
- קהל יעד: ${survey.audience}
- תחומי מיקוד: ${contentFocuses.join(', ')}
- תחומי KIT למדידה: ${kitDomains.join(', ')}

כל שאלה צריכה:
1. להיות קצרה וברורה
2. מתאימה לקהל היעד
3. להתייחס לאחד מתחומי ה-KIT

החזר JSON עם מערך שאלות.`;

      const scaleResponse = await base44.integrations.Core.InvokeLLM({
        prompt: scaleQuestionsPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  prompt: { type: "string" },
                  kit_domain: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Step 4: Generate open questions
      setGenerationStep(4);

      const openQuestionsPrompt = `צור 2 שאלות פתוחות עבור סקר משוב על פעילות חינוכית.
פרטי הפעילות:
- תיאור: ${survey.activity_description}
- סוג: ${survey.event_type}
- קהל: ${survey.audience}

שאלה אחת צריכה להיות על מה היה טוב/מוצלח.
שאלה שנייה על מה ניתן לשפר.
${survey.event_type === 'ongoing_program' ? 'התייחס לתהליך המתמשך ולא רק לאירוע בודד.' : ''}`;

      const openResponse = await base44.integrations.Core.InvokeLLM({
        prompt: openQuestionsPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  prompt: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Generate bottom line question based on audience
      const bottomLinePrompts = {
        students: 'האם היית ממליץ/ה לחברים להשתתף בפעילות כזו?',
        parents: 'האם הייתם רוצים שילדכם ישתתף בפעילויות דומות בעתיד?',
        teachers: 'האם הייתם ממליצים להמשיך את הפעילות הזו?',
        management: 'האם יש ערך מוסף לפעילות זו בהשוואה למשאבים המושקעים?'
      };

      // Step 5: Save questions
      setGenerationStep(5);

      // Create all questions in database
      let orderIndex = 0;
      const questionsToCreate = [];

      // Scale questions
      for (const q of scaleResponse.questions || []) {
        questionsToCreate.push({
          survey_id: surveyId,
          order_index: orderIndex++,
          question_type: 'scale_5',
          kit_domain: q.kit_domain || 'relevance',
          prompt_hebrew: q.prompt,
          is_required: true,
          scale_labels: { low: 'לא מסכים כלל', high: 'מסכים לחלוטין' },
          is_generated: true
        });
      }

      // Open questions
      for (const q of openResponse.questions || []) {
        questionsToCreate.push({
          survey_id: surveyId,
          order_index: orderIndex++,
          question_type: 'open_text',
          kit_domain: 'none',
          prompt_hebrew: q.prompt,
          is_required: false,
          is_generated: true
        });
      }

      // Bottom line question
      questionsToCreate.push({
        survey_id: surveyId,
        order_index: orderIndex++,
        question_type: 'bottom_line',
        kit_domain: 'none',
        prompt_hebrew: bottomLinePrompts[survey.audience] || bottomLinePrompts.students,
        is_required: true,
        choices: [
          { value: 'yes', label: 'כן, בהחלט' },
          { value: 'maybe', label: 'אולי' },
          { value: 'no', label: 'לא' }
        ],
        is_generated: true
      });

      // Bulk create questions
      await base44.entities.SurveyQuestion.bulkCreate(questionsToCreate);

      // Generate intro text
      const introResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `כתוב פסקת פתיחה קצרה (2-3 משפטים) לסקר משוב על הפעילות הבאה:
${survey.activity_description}

הפסקה צריכה להיות ידידותית, להסביר את מטרת הסקר בקצרה, ולהבטיח שהתשובות אנונימיות.
קהל היעד: ${survey.audience}`,
        response_json_schema: {
          type: "object",
          properties: {
            intro: { type: "string" }
          }
        }
      });

      // Update survey with intro and title
      await base44.entities.Survey.update(surveyId, {
        intro_text: introResponse.intro,
        title: survey.activity_description?.slice(0, 50) || 'סקר משוב',
        current_step: 'B3',
        last_autosave: new Date().toISOString()
      });

      setIsComplete(true);
      toast.success('הסקר נוצר בהצלחה!');

    } catch (error) {
      console.error('Generation error:', error);
      toast.error('שגיאה ביצירת הסקר');
      setIsGenerating(false);
    }
  };

  const handleContinue = () => {
    navigate(createPageUrl('SurveyEditor') + `?surveyId=${surveyId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <AnimatePresence mode="wait">
          {!isGenerating && !isComplete && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-12 h-12 text-[#E85A24]" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#6B2D4A] mb-4">
                הכל מוכן ליצירת הסקר
              </h1>
              <p className="text-gray-500 mb-8">
                המערכת תייצר סקר מותאם אישית בהתבסס על הפרטים שהזנת
              </p>
              <Button
                onClick={generateQuestions}
                className="px-8 py-6 bg-[#E85A24] hover:bg-[#D14A1A] text-white text-lg font-medium rounded-xl shadow-lg shadow-orange-200"
              >
                <Sparkles className="w-5 h-5 ml-2" />
                צור סקר
              </Button>
            </motion.div>
          )}

          {isGenerating && !isComplete && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-12 h-12 text-[#E85A24] animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-[#6B2D4A] mb-4">
                יוצר את הסקר...
              </h1>
              
              <div className="space-y-3 text-right max-w-xs mx-auto">
                {generationSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: index <= generationStep ? 1 : 0.3,
                      x: 0 
                    }}
                    className="flex items-center gap-3"
                  >
                    {index < generationStep ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : index === generationStep ? (
                      <Loader2 className="w-5 h-5 text-[#E85A24] animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span className={index <= generationStep ? 'text-gray-800' : 'text-gray-400'}>
                      {step}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {isComplete && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#6B2D4A] mb-4">
                הסקר נוצר בהצלחה!
              </h1>
              <p className="text-gray-500 mb-8">
                עכשיו תוכל לערוך ולהתאים את הסקר לפני הפרסום
              </p>
              <Button
                onClick={handleContinue}
                className="px-8 py-6 bg-[#E85A24] hover:bg-[#D14A1A] text-white text-lg font-medium rounded-xl shadow-lg shadow-orange-200"
              >
                <FileText className="w-5 h-5 ml-2" />
                עבור לעריכת הסקר
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}