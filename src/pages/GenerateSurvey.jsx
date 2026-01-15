import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  const [scalePrompt, setScalePrompt] = useState('');
  const [openPrompt, setOpenPrompt] = useState('');
  const [promptReady, setPromptReady] = useState(false);

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

  const buildPrompts = async () => {
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

    const contentFocusLabels = {
      pedagogical: 'לימודי-פדגוגי',
      social_emotional: 'חברתי-רגשי',
      values: 'ערכי',
      organizational: 'ארגוני-לוגיסטי',
      community: 'קהילתי'
    };

    const selectedGrades = survey.grade_range?.selected_grades?.map(g => gradeLabels[g]).join(', ') || '';
    const evaluationGoals = Array.isArray(survey.evaluation_goal) 
      ? survey.evaluation_goal.join(', ') 
      : survey.evaluation_goal || '';
    const successDef = survey.success_definition?.selected_ideas?.join(', ') || survey.success_definition?.custom_text || '';
    const contentFocusDisplay = contentFocuses.map(cf => contentFocusLabels[cf] || cf).join(', ');

    // Build comprehensive prompt based on "ערכה להערכת תכניות ופעילויות בית ספריות" framework
    const newScalePrompt = `אתה מומחה להערכה בית ספרית מבוסס על "ערכה להערכת תכניות ופעילויות בית ספריות" של רשת עתיד.

🎯 מטרת השאלון: לסייע לצוותים לקיים הערכה פשוטה, עניינית ומשמעותית שתשמש תשתית לקבלת החלטות מבוססות נתונים.

═══════════════════════════════════════
📋 פרטי הפעילות/תוכנית:
═══════════════════════════════════════
• תיאור: ${survey.activity_description || 'לא צוין'}
• קהל יעד: ${audienceLabels[survey.audience] || survey.audience}
• שכבות גיל: ${selectedGrades || 'לא צוין'}
• סוג: ${eventTypeLabels[survey.event_type] || survey.event_type || 'לא צוין'}
• תחומי מיקוד: ${contentFocusDisplay}
${valuesToMeasure ? `• ערכים למדידה: ${valuesToMeasure}` : ''}
${knowledgeToMeasure ? `• ידע למדידה: ${knowledgeToMeasure}` : ''}
${skillsToMeasure ? `• מיומנויות למדידה: ${skillsToMeasure}` : ''}
${evaluationGoals ? `• מטרות ההערכה: ${evaluationGoals}` : ''}
${successDef ? `• הגדרת הצלחה: ${successDef}` : ''}

═══════════════════════════════════════
🔬 מודל ההערכה הרב-שכבתי (KIT Framework):
═══════════════════════════════════════
כל שאלון חייב לכסות את כל השכבות הבאות (לפחות היגד אחד לכל שכבה):

🅰️ שכבה קוגניטיבית - רכישת ידע:
   • למדתי דבר/ים חדש/ים שלא ידעתי לפני
   • הרגשתי שקיבלתי משהו משמעותי (ידע, השראה, כלים, מחשבה חדשה)

🅱️ שכבה של מיומנויות ויישום:
   • הפעילות גרמה לי לחשוב אחרת / לפעול אחרת
   • שיפרתי מיומנות מסוימת

🅲️ שכבה רגשית-מוטיבציונית:
   • עניין והנאה
   • נכונות להשתתף שוב

🅳️ שכבת שייכות והשתתפות:
   • תחושת שייכות לכיתה/קבוצה/בית הספר
   • הזדמנות להביע דעות
   • השתתפות פעילה

🅴️ שכבת רלוונטיות:
   • רלוונטיות אישית
   • קשר לעולם האמיתי

🅵️ איכות ההנחייה/הדרכה:
   • בהירות ומובנות
   • העברה מעניינת
   • אפשור השתתפות פעילה

═══════════════════════════════════════
⚠️ הנחיות מחייבות - חובה לעקוב!
═══════════════════════════════════════
1. ✅ כל היגד מודד ממד אחד בלבד - לא מערבבים!
2. ✅ אין חזרתיות - כל היגד שונה מהותית מהאחרים
3. ✅ ניסוח בחיוב (לא "לא הרגשתי...")
4. ✅ קצר וברור - עד 15 מילים להיגד
5. ✅ דירוג: 5 דרגות (1=בכלל לא מסכים, 5=מסכים מאוד)

${survey.audience === 'students' ? `
═══════════════════════════════════════
📝 הנחיות שפה לתלמידים - קריטי!
═══════════════════════════════════════
• גוף שני (את/ה) - לא גוף ראשון (אני)
• שפה פשוטה וידידותית - לא מקצועית!
• ❌ לא: "פדגוגי", "הקנייה", "טיפוח ערכים", "רכישת מיומנויות"
• ✅ כן: "מעניין", "למדתי", "הרגשתי", "נהניתי"

דוגמאות לתרגום:
• "עד כמה התרשמת מהתוכן הפדגוגי" → "עד כמה התכנים היו מעניינים עבורך"
• "עד כמה תרמת לטיפוח ערכים" → "עד כמה הרגשת שהפעילות הייתה משמעותית"
• "עד כמה רכשת מיומנויות" → "עד כמה למדת דברים חדשים"
` : ''}

═══════════════════════════════════════
📊 מבנה השאלון הנדרש:
═══════════════════════════════════════
צור בדיוק 10 היגדים לדירוג, מחולקים כך:

1-2. רכישת ידע (שכבה A)
3-4. מיומנויות ויישום (שכבה B)  
5-6. שייכות והשתתפות (שכבה D)
7. רלוונטיות (שכבה E)
8-9. איכות ההנחייה (שכבה F)
10. משמעות אישית כוללת

‼️ CRITICAL - קריטי ביותר:
כל שורה חייבת להיות היגד (statement) ולא שאלה (question)!

❌ אסור לכתוב שאלות כמו:
- "מה למדת?"
- "איך השפיע הביקור?"
- "מהם הדברים שלמדת?"
- "מה היה החלק המשמעותי?"
- "אם היית יכול לשנות?"

✅ חובה לכתוב היגדים בלבד:
- "למדתי דברים חדשים ומעניינים"
- "הביקור שינה את הבנתי"
- "הפעילות הייתה רלוונטית עבורי"
- "המנחה הסביר בצורה ברורה"
- "חוויתי רגעים משמעותיים"

הכלל: כל משפט צריך להתחיל בפועל או בשם עצם, לא במילת שאלה!

═══════════════════════════════════════
📤 פורמט התשובה:
═══════════════════════════════════════
החזר JSON עם מערך של 10 היגדים בדיוק.

⚠️ זכור: אין למצוא בהיגדים סימני שאלה (?) או מילות שאלה (מה, איך, מהם, אם)

כל היגד כולל:
- prompt: משפט חיובי המתאר מצב/רגש בגוף ראשון (WITHOUT QUESTION MARKS!)
- kit_domain: אחד מ: relevance, skills, delivery_quality, belonging

דוגמאות נכונות:
{
  "questions": [
    {"prompt": "למדתי דברים חדשים שלא ידעתי קודם", "kit_domain": "skills"},
    {"prompt": "המנחה העביר את הפעילות בצורה מעניינת", "kit_domain": "delivery_quality"},
    {"prompt": "הרגשתי שייכות לקבוצה במהלך הפעילות", "kit_domain": "belonging"},
    {"prompt": "התכנים היו רלוונטיים לחיי היומיום שלי", "kit_domain": "relevance"}
  ]
}

דוגמאות שגויות (אסור!):
❌ "מה למדת?" 
❌ "איך הרגשת?"
❌ "מהם הדברים שלמדת?"
❌ כל משפט עם סימן שאלה`;

    const newOpenPrompt = `אתה מומחה להערכה בית ספרית. צור שאלות פתוחות לסקר משוב.

═══════════════════════════════════════
📋 פרטי הפעילות:
═══════════════════════════════════════
• תיאור: ${survey.activity_description}
• סוג: ${eventTypeLabels[survey.event_type] || survey.event_type}
• קהל: ${audienceLabels[survey.audience] || survey.audience}

═══════════════════════════════════════
🎯 עקרון מנחה:
═══════════════════════════════════════
השאלות הפתוחות משלימות את שאלות הדירוג - לא חוזרות עליהן!
מספרים מראים לאן להסתכל; שאלות פתוחות מסבירות למה.

═══════════════════════════════════════
📊 צור בדיוק 4 שאלות פתוחות:
═══════════════════════════════════════

1️⃣ שאלה רפלקטיבית על למידה עצמית:
   "בעקבות הפעילות למדתי על עצמי ש..."
   או: "מה מהפעילות היית מיישם כבר עכשיו?"

2️⃣ שאלה על חלק משמעותי/מוצלח:
   "מה היה הכי משמעותי עבורך בפעילות?"
   או: "פרט/י מה אהבת בפעילות"

3️⃣ שאלה ביקורתית לשיפור:
   "מה פחות התחברת אליו או שהיה ניתן לשפר?"
   או: "אילו דברים היית רוצה לשנות?"

4️⃣ שאלה פתוחה כללית:
   "משהו נוסף שתרצה לשתף?"
   או: "האם יש נושא שהיית רוצה שידברו עליו בעתיד?"

═══════════════════════════════════════
⚠️ הנחיות מחייבות:
═══════════════════════════════════════
${survey.audience === 'students' ? '• שפה פשוטה בגוף שני (את/ה)' : '• שפה מקצועית מכבדת'}
${survey.event_type === 'ongoing_program' ? '• התייחס לתהליך המתמשך, לא רק לאירוע בודד' : ''}
• שאלות קצרות וברורות
• לא לחזור על אותם רעיונות משאלות הדירוג

═══════════════════════════════════════
📤 פורמט התשובה:
═══════════════════════════════════════
{
  "questions": [
    {"prompt": "טקסט השאלה הראשונה"},
    {"prompt": "טקסט השאלה השנייה"},
    {"prompt": "טקסט השאלה השלישית"},
    {"prompt": "טקסט השאלה הרביעית"}
  ]
}`;

    // Check for active admin prompt from database
    try {
      const adminPrompts = await base44.entities.AdminPrompt.filter({ is_active: true });
      const activePrompt = adminPrompts.find(p => 
        p.is_active && (p.language === 'both' || p.language === survey.language || p.language === 'hebrew')
      );
      
      console.log('Active prompt found:', activePrompt?.name);
      
      if (activePrompt) {
        // Use the unified prompt for both scale and open questions
        let customPrompt = activePrompt.prompt_text;
        
        // Replace all variables
        customPrompt = customPrompt.replace(/{activity_description}/g, survey.activity_description || 'לא צוין');
        customPrompt = customPrompt.replace(/{audience}/g, audienceLabels[survey.audience] || survey.audience);
        customPrompt = customPrompt.replace(/{grades}/g, selectedGrades || 'לא צוין');
        customPrompt = customPrompt.replace(/{event_type}/g, eventTypeLabels[survey.event_type] || survey.event_type || 'לא צוין');
        customPrompt = customPrompt.replace(/{content_focus}/g, contentFocusDisplay);
        customPrompt = customPrompt.replace(/{values_section}/g, valuesToMeasure ? `• ערכים למדידה: ${valuesToMeasure}` : '');
        customPrompt = customPrompt.replace(/{knowledge_section}/g, knowledgeToMeasure ? `• ידע למדידה: ${knowledgeToMeasure}` : '');
        customPrompt = customPrompt.replace(/{skills_section}/g, skillsToMeasure ? `• מיומנויות למדידה: ${skillsToMeasure}` : '');
        customPrompt = customPrompt.replace(/{goals_section}/g, evaluationGoals ? `• מטרות ההערכה: ${evaluationGoals}` : '');
        customPrompt = customPrompt.replace(/{success_section}/g, successDef ? `• הגדרת הצלחה: ${successDef}` : '');
        
        // Also replace audience language section
        const studentLanguageSection = survey.audience === 'students' ? `
═══════════════════════════════════════
📝 הנחיות שפה לתלמידים - קריטי!
═══════════════════════════════════════
• גוף שני (את/ה) - לא גוף ראשון (אני)
• שפה פשוטה וידידותית - לא מקצועית!
• ❌ לא: "פדגוגי", "הקנייה", "טיפוח ערכים", "רכישת מיומנויות"
• ✅ כן: "מעניין", "למדתי", "הרגשתי", "נהניתי"` : '';
        
        customPrompt = customPrompt.replace(/{student_language_section}/g, studentLanguageSection);
        
        const audienceLanguage = survey.audience === 'students' ? 'שפה פשוטה בגוף שני (את/ה)' : 'שפה מקצועית מכבדת';
        customPrompt = customPrompt.replace(/{audience_language}/g, audienceLanguage);
        
        const ongoingNote = survey.event_type === 'ongoing_program' ? 'התייחס לתהליך המתמשך, לא רק לאירוע בודד' : '';
        customPrompt = customPrompt.replace(/{ongoing_note}/g, ongoingNote);
        
        console.log('Using unified prompt, length:', customPrompt.length);
        setScalePrompt(customPrompt);
        setOpenPrompt(customPrompt); // Use same unified prompt for both
      } else {
        console.log('No active prompt, using defaults');
        setScalePrompt(newScalePrompt);
        setOpenPrompt(newOpenPrompt);
      }
    } catch (error) {
      console.error('Error loading active prompt:', error);
      setScalePrompt(newScalePrompt);
      setOpenPrompt(newOpenPrompt);
    }
    
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

      // Check if using unified prompt (scale_questions + open_questions) or legacy format (questions only)
      const isUnifiedPrompt = scalePrompt === openPrompt;
      
      let scaleResponse, openResponse;
      
      if (isUnifiedPrompt) {
        // Unified prompt - get both scale and open questions in one call
        console.log('Using unified prompt format');
        const unifiedResponse = await base44.integrations.Core.InvokeLLM({
          prompt: scalePrompt,
          response_json_schema: {
            type: "object",
            properties: {
              scale_questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    prompt: { type: "string" },
                    kit_domain: { type: "string" },
                    scale_labels: {
                      type: "object",
                      properties: {
                        low: { type: "string" },
                        high: { type: "string" }
                      }
                    }
                  }
                }
              },
              open_questions: {
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
        
        console.log('Unified response:', unifiedResponse);
        console.log('Scale questions count:', unifiedResponse.scale_questions?.length);
        console.log('Open questions count:', unifiedResponse.open_questions?.length);
        
        scaleResponse = { questions: unifiedResponse.scale_questions || [] };
        openResponse = { questions: unifiedResponse.open_questions || [] };
        
        setGenerationStep(4);
      } else {
        // Legacy separate prompts
        console.log('Using separate prompts format');
        const scaleResult = await base44.integrations.Core.InvokeLLM({
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
                    kit_domain: { type: "string" },
                    scale_labels: {
                      type: "object",
                      properties: {
                        low: { type: "string" },
                        high: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        });
        
        console.log('Scale response:', scaleResult);
        scaleResponse = scaleResult;

        // Step 4: Generate open questions
        setGenerationStep(4);

        const openResult = await base44.integrations.Core.InvokeLLM({
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
        
        console.log('Open response:', openResult);
        openResponse = openResult;
      }

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
      
      // Add name question if survey is not anonymous
      if (survey.is_anonymous === false) {
        questionsToCreate.push({
          survey_id: surveyId,
          order_index: orderIndex++,
          question_type: 'open_text',
          kit_domain: 'none',
          prompt_hebrew: 'מה שמך?',
          is_required: true,
          is_generated: true
        });
      }
      
      if (bgQuestions.include_class) {
        // Build choices based on selected grade ranges
        const selectedGradeRanges = survey.grade_range?.selected_grades || [];
        const gradeChoicesMap = {
          middle: [
            { value: 'z', label: 'ז׳' },
            { value: 'h', label: 'ח׳' },
            { value: 't', label: 'ט׳' }
          ],
          high: [
            { value: 'y', label: 'י׳' },
            { value: 'ya', label: 'י״א' },
            { value: 'yb', label: 'י״ב' }
          ],
          college: [
            { value: 'yg', label: 'י״ג' },
            { value: 'yd', label: 'י״ד' }
          ]
        };
        
        const relevantChoices = selectedGradeRanges.flatMap(range => gradeChoicesMap[range] || []);
        
        questionsToCreate.push({
          survey_id: surveyId,
          order_index: orderIndex++,
          question_type: 'single_choice',
          kit_domain: 'none',
          prompt_hebrew: survey.audience === 'parents' ? 'באיזו כיתה ילדך/ילדתך?' : 'באיזו כיתה את/ה?',
          is_required: true,
          choices: relevantChoices.length > 0 ? relevantChoices : [
            { value: 'z', label: 'ז׳' },
            { value: 'h', label: 'ח׳' },
            { value: 't', label: 'ט׳' }
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
          scale_labels: q.scale_labels || { low: 'לא מסכים כלל', high: 'מסכים לחלוטין' },
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
                המערכת תייצר שאלון מותאם אישית בהתבסס על הפרטים שהזנת
              </p>

              <Button
                onClick={generateQuestions}
                disabled={!scalePrompt.trim() || !promptReady}
                className="px-8 py-6 bg-[#E85A24] hover:bg-[#D14A1A] text-white text-lg font-medium rounded-xl shadow-lg shadow-orange-200"
              >
                <Sparkles className="w-5 h-5 ml-2" />
                צור סקר
              </Button>
              {scalePrompt && (
                <p className="text-xs text-gray-400 mt-3">
                  {scalePrompt.includes('prompt v2') ? '✅ משתמש בפרומפט מותאם' : 'משתמש בפרומפט סטנדרטי'}
                </p>
              )}
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