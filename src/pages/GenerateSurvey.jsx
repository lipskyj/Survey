import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle, FileText, Edit2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [scalePrompt, setScalePrompt] = useState('');
  const [openPrompt, setOpenPrompt] = useState('');
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [promptReady, setPromptReady] = useState(false);
  const [defaultScalePrompt, setDefaultScalePrompt] = useState('');

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

  // Build prompts when survey loads
  useEffect(() => {
    if (survey) {
      buildPrompts();
    }
  }, [survey]);

  const buildPrompts = () => {
    const contentFocuses = survey.content_focus || ['pedagogical'];
    const measurementTargets = survey.measurement_targets || {};
    const valuesToMeasure = measurementTargets.selected_values?.join(', ') || '';
    const knowledgeToMeasure = measurementTargets.selected_knowledge?.join(', ') || '';
    const skillsToMeasure = measurementTargets.selected_skills?.join(', ') || '';

    const audienceLabels = {
      students: 'תלמידים',
      parents: 'הורים', 
      teachers: 'מורים',
      management: 'הנהלה'
    };

    const eventTypeLabels = {
      single_event: 'אירוע חד פעמי',
      ongoing_program: 'תוכנית מתמשכת',
      annual_activity: 'פעילות שנתית קבועה',
      special_project: 'פרויקט מיוחד'
    };

    const gradeLabels = {
      middle: 'חטיבת ביניים (ז׳-ט׳)',
      high: 'תיכון (י׳-י״ב)',
      college: 'מכללה (י״ג-י״ד)'
    };

    const selectedGrades = survey.grade_range?.selected_grades?.map(g => gradeLabels[g]).join(', ') || '';
    const evaluationGoals = Array.isArray(survey.evaluation_goal) 
      ? survey.evaluation_goal.join(', ') 
      : survey.evaluation_goal || '';
    const successDef = survey.success_definition?.selected_ideas?.join(', ') || survey.success_definition?.custom_text || '';

    const newScalePrompt = `אתה מומחה להערכה בית ספרית. אנא בנה עבורי שאלון משוב בהתאם לפרטים שאספק.

🔵 פרטי הפעילות:
- תיאור הפעילות: ${survey.activity_description || 'לא צוין'}
- קהל יעד: ${audienceLabels[survey.audience] || survey.audience}
- שכבות גיל: ${selectedGrades || 'לא צוין'}
- סוג הפעילות: ${eventTypeLabels[survey.event_type] || survey.event_type || 'לא צוין'}
- תחומי מיקוד: ${contentFocuses.join(', ')}
${valuesToMeasure ? `- ערכים למדידה: ${valuesToMeasure}` : ''}
${knowledgeToMeasure ? `- ידע למדידה: ${knowledgeToMeasure}` : ''}
${skillsToMeasure ? `- מיומנויות למדידה: ${skillsToMeasure}` : ''}
${evaluationGoals ? `- מטרות ההערכה: ${evaluationGoals}` : ''}
${successDef ? `- הגדרת הצלחה: ${successDef}` : ''}

🔵 הנחיות מחייבות (שיש לעמוד בהן בקפדנות):
1. כל שאלה/היגד תתייחס לממד אחד בלבד
2. אין חזרתיות – כל היגד מודד ממד אחר, ללא ניסוחים קרובים
3. השאלון יהיה מותאם לקהל היעד עם ניסוחים בהירים ופשוטים
4. דירוג לפי מידת הסכמה (5 דרגות: 1=בכלל לא מסכים, 5=מסכים מאוד)

${survey.audience === 'students' ? `🔵 הנחיות שפה לתלמידים (קריטי!):
- השתמש בגוף שני (את/ה) ולא בגוף ראשון
- אל תשתמש בשפה מקצועית כמו "פדגוגי", "הקנייה", "טיפוח ערכים"
- השתמש בשפה פשוטה וידידותית שתלמידים מבינים
- לדוגמה: במקום "עד כמה התרשמתי מהתוכן הפדגוגי" → "עד כמה התכנים היו מעניינים עבורך"` : ''}

🔵 מבנה השאלון הנדרש:
צור בדיוק 8-10 שאלות דירוג (היגדים) הכוללות:
- לפחות 2 שאלות על איכות ההדרכה/הנחייה
- לפחות שאלה אחת על גיבוש כיתתי/קבוצתי (אם רלוונטי לפעילות)
- היגד אחד משולב ברעיון של משמעות אישית (לדוגמה: "הרגשתי שיש לי הזדמנות להביא לידי ביטוי חוזקות אישיות")
- שאר השאלות יתפלגו על פני תחומי המיקוד השונים

כל היגד צריך להיות:
- קצר וברור (עד 15 מילים)
- מודד ממד אחד ספציפי
- מנוסח בחיוב (לא שלילה)

החזר JSON עם מערך שאלות.`;

    const newOpenPrompt = `צור בדיוק 4 שאלות פתוחות עבור סקר משוב על פעילות חינוכית.

פרטי הפעילות:
- תיאור: ${survey.activity_description}
- סוג: ${survey.event_type}
- קהל: ${survey.audience}

🔵 הנחיות מחייבות לשאלות הפתוחות:
השאלות הפתוחות לא יחזרו על אותו רעיון של שאלות הדירוג — הן משלימות ולא משכפלות.

צור בדיוק 4 שאלות פתוחות:
1. שאלה על תרומה/ערך - מה הדבר המרכזי שלקחת מהפעילות
2. שאלה על שיפור/המשך, תוך התייחסות לאתגר - מה ניתן לשפר
3. שאלה על חוויה משמעותית או רגע מיוחד
4. שאלה על המלצות לעתיד

${survey.audience === 'students' ? 'השתמש בגוף שני (את/ה) ושפה פשוטה וידידותית.' : ''}
${survey.event_type === 'ongoing_program' ? 'התייחס לתהליך המתמשך ולא רק לאירוע בודד.' : ''}`;

    setScalePrompt(newScalePrompt);
    setOpenPrompt(newOpenPrompt);
    setDefaultScalePrompt(newScalePrompt);
    setPromptReady(true);
  };

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

      const scaleResponse = await base44.integrations.Core.InvokeLLM({
        prompt: scalePrompt,
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

      const openResponse = await base44.integrations.Core.InvokeLLM({
        prompt: openPrompt,
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

      // Background questions (if configured)
      const bgQuestions = survey.background_questions || {};
      
      if (bgQuestions.include_class) {
        questionsToCreate.push({
          survey_id: surveyId,
          order_index: orderIndex++,
          question_type: 'single_choice',
          kit_domain: 'none',
          prompt_hebrew: survey.audience === 'parents' ? 'באיזו כיתה ילדך/ילדתך?' : 'באיזו כיתה את/ה?',
          is_required: true,
          choices: [
            { value: 'z', label: 'ז׳' },
            { value: 'h', label: 'ח׳' },
            { value: 't', label: 'ט׳' },
            { value: 'y', label: 'י׳' },
            { value: 'ya', label: 'י״א' },
            { value: 'yb', label: 'י״ב' }
          ],
          is_generated: true
        });
      }

      if (bgQuestions.include_gender) {
        questionsToCreate.push({
          survey_id: surveyId,
          order_index: orderIndex++,
          question_type: 'single_choice',
          kit_domain: 'none',
          prompt_hebrew: 'מה המגדר שלך?',
          is_required: true,
          choices: [
            { value: 'male', label: 'זכר' },
            { value: 'female', label: 'נקבה' },
            { value: 'other', label: 'אחר' }
          ],
          is_generated: true
        });
      }

      if (bgQuestions.include_subject) {
        questionsToCreate.push({
          survey_id: surveyId,
          order_index: orderIndex++,
          question_type: 'open_text',
          kit_domain: 'none',
          prompt_hebrew: 'מה המקצוע/ות שאת/ה מלמד/ת?',
          is_required: true,
          is_generated: true
        });
      }

      if (bgQuestions.include_role) {
        questionsToCreate.push({
          survey_id: surveyId,
          order_index: orderIndex++,
          question_type: 'open_text',
          kit_domain: 'none',
          prompt_hebrew: 'מה תפקידך בהנהלה?',
          is_required: true,
          is_generated: true
        });
      }

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
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full text-center">
        <AnimatePresence mode="wait">
          {!isGenerating && !isComplete && promptReady && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-[#E85A24]" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#6B2D4A] mb-2">
                הכל מוכן ליצירת הסקר
              </h1>
              <p className="text-gray-500 mb-6">
                בדוק ועדכן את הפרומפט לפי הצורך לפני יצירת השאלון
              </p>

              {/* Prompt Display Card */}
              <Card className="text-right mb-6 border-2 border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-[#6B2D4A] flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#E85A24]" />
                      הפרומפט שיישלח ל-AI (שאלות דירוג)
                    </CardTitle>
                    <div className="flex gap-2">
                      {isEditingPrompt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setScalePrompt(defaultScalePrompt);
                            toast.success('הפרומפט אופס לברירת המחדל');
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <RotateCcw className="w-4 h-4 ml-1" />
                          איפוס
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                        className="text-[#E85A24] hover:text-[#D14A1A]"
                      >
                        <Edit2 className="w-4 h-4 ml-1" />
                        {isEditingPrompt ? 'סיום עריכה' : 'עריכה'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditingPrompt ? (
                    <Textarea
                      value={scalePrompt}
                      onChange={(e) => setScalePrompt(e.target.value)}
                      className="min-h-[300px] text-sm font-mono leading-relaxed"
                      dir="rtl"
                    />
                  ) : (
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto bg-gray-50 p-4 rounded-lg border">
                      {scalePrompt}
                    </pre>
                  )}
                </CardContent>
              </Card>

              <Button
                onClick={generateQuestions}
                disabled={!scalePrompt.trim()}
                className="px-8 py-6 bg-[#E85A24] hover:bg-[#D14A1A] text-white text-lg font-medium rounded-xl shadow-lg shadow-orange-200"
              >
                <Sparkles className="w-5 h-5 ml-2" />
                צור סקר
              </Button>
            </motion.div>
          )}

          {!isGenerating && !isComplete && !promptReady && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 className="w-12 h-12 text-[#E85A24] animate-spin mx-auto" />
              <p className="text-gray-500 mt-4">טוען נתונים...</p>
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
              className="w-full"
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