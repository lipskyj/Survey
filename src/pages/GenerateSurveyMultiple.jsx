import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle, FileText, Eye, ArrowRight, Trash2, Check } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';
import SurveyPreview from '../components/SurveyPreview';

const KIT_MAPPING = {
  pedagogical: ['relevance', 'skills', 'delivery_quality'],
  social_emotional: ['belonging', 'relevance', 'delivery_quality'],
  values: ['belonging', 'relevance'],
  organizational: ['relevance', 'delivery_quality'],
  community: ['belonging', 'relevance']
};

export default function GenerateSurveyMultiple() {
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [surveyId, setSurveyId] = useState(null);
  const [activePrompts, setActivePrompts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [generatedSurveys, setGeneratedSurveys] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [viewingVersion, setViewingVersion] = useState(null);
  const [selectedVersions, setSelectedVersions] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('surveyId');
        
        if (!id) {
          console.error('No surveyId in URL');
          toast.error('חסר מזהה סקר');
          return;
        }
        
        setSurveyId(id);
        const surveys = await base44.entities.Survey.filter({ id });
        
        if (surveys.length === 0) {
          console.error('Survey not found');
          toast.error('סקר לא נמצא');
          return;
        }
        
        const loadedSurvey = surveys[0];
        setSurvey(loadedSurvey);
        console.log('Survey loaded:', loadedSurvey);
        
        // Load active prompts
        const prompts = await base44.entities.AdminPrompt.filter({ is_active: true });
        console.log('Active prompts loaded:', prompts.length);
        setActivePrompts(prompts);
        
        // Auto-start generation after state is set
        if (prompts.length > 0) {
          setTimeout(() => {
            console.log('Starting auto-generation');
            startGeneration(prompts, loadedSurvey);
          }, 500);
        } else {
          toast.error('אין פרומפטים פעילים');
        }
      } catch (error) {
        console.error('Load error:', error);
        toast.error('שגיאה בטעינת נתונים');
      }
    };
    loadData();
  }, []);

  const generateWith4Steps = async (prompt, useSurvey) => {
    console.log('Starting 4-step generation process');
    
    // Build survey context
    const surveyContext = buildSurveyContext(useSurvey);
    
    // Step 1: Context Map
    console.log('Step 1: Generating context map');
    const contextMapResponse = await base44.integrations.Core.InvokeLLM({
      prompt: buildStep1Prompt(surveyContext),
      response_json_schema: {
        type: "object",
        properties: {
          intervention_type: { type: "array", items: { type: "string" } },
          time_logic: { type: "string" },
          risk_level: { type: "string" },
          anchors: { type: "object" },
          dimensions_allowed: { type: "array" },
          dimensions_forbidden: { type: "array" },
          question_language_rules: { type: "object" }
        }
      }
    });
    
    // Step 2: Blueprint
    console.log('Step 2: Generating blueprint');
    const blueprintResponse = await base44.integrations.Core.InvokeLLM({
      prompt: buildStep2Prompt(contextMapResponse, surveyContext),
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          intro_style: { type: "object" },
          background_questions: { type: "array" },
          sections: { type: "array" },
          open_questions_plan: { type: "array" },
          decision_questions_plan: { type: "array" },
          total_counts: { type: "object" }
        }
      }
    });
    
    // Step 3: Write Questions
    console.log('Step 3: Writing questions');
    const surveyResponse = await base44.integrations.Core.InvokeLLM({
      prompt: buildStep3Prompt(contextMapResponse, blueprintResponse, surveyContext),
      response_json_schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          intro: { type: "string" },
          background_questions: { type: "array" },
          scale_questions: { type: "array" },
          open_questions: { type: "array" },
          decision_questions: { type: "array" }
        }
      }
    });
    
    // Step 4: Quality Gate
    console.log('Step 4: Quality check');
    const finalSurveyResponse = await base44.integrations.Core.InvokeLLM({
      prompt: buildStep4Prompt(contextMapResponse, blueprintResponse, surveyResponse),
      response_json_schema: {
        type: "object",
        properties: {
          scale_questions: { type: "array" },
          open_questions: { type: "array" }
        }
      }
    });
    
    // Create survey with questions
    const newSurvey = await base44.entities.Survey.create({
      ...useSurvey,
      title: `${useSurvey.activity_description?.slice(0, 30) || 'סקר'} - ${prompt.name}`,
      prompt_version: prompt.name,
      status: 'draft'
    });
    
    // Create questions
    let orderIndex = 0;
    const questionsToCreate = [];
    const bgQuestions = useSurvey.background_questions || {};
    
    if (useSurvey.is_anonymous === false) {
      questionsToCreate.push({
        survey_id: newSurvey.id,
        order_index: orderIndex++,
        question_type: 'open_text',
        kit_domain: 'none',
        prompt_hebrew: 'מה שמך?',
        is_required: true,
        is_generated: true
      });
    }
    
    if (bgQuestions.include_class) {
      const selectedGradeRanges = useSurvey.grade_range?.selected_grades || [];
      const gradeChoicesMap = {
        middle: [{ value: 'z', label: 'ז׳' }, { value: 'h', label: 'ח׳' }, { value: 't', label: 'ט׳' }],
        high: [{ value: 'y', label: 'י׳' }, { value: 'ya', label: 'י״א' }, { value: 'yb', label: 'י״ב' }],
        college: [{ value: 'yg', label: 'י״ג' }, { value: 'yd', label: 'י״ד' }]
      };
      const relevantChoices = selectedGradeRanges.flatMap(range => gradeChoicesMap[range] || []);
      questionsToCreate.push({
        survey_id: newSurvey.id,
        order_index: orderIndex++,
        question_type: 'single_choice',
        kit_domain: 'none',
        prompt_hebrew: useSurvey.audience === 'parents' ? 'באיזו כיתה ילדך/ילדתך?' : 'באיזו כיתה את/ה?',
        is_required: true,
        choices: relevantChoices.length > 0 ? relevantChoices : [{ value: 'z', label: 'ז׳' }],
        is_generated: true
      });
    }
    
    if (bgQuestions.include_gender) {
      questionsToCreate.push({
        survey_id: newSurvey.id,
        order_index: orderIndex++,
        question_type: 'single_choice',
        kit_domain: 'none',
        prompt_hebrew: 'מה המגדר שלך?',
        is_required: true,
        choices: [{ value: 'male', label: 'זכר' }, { value: 'female', label: 'נקבה' }, { value: 'other', label: 'אחר' }],
        is_generated: true
      });
    }
    
    for (const q of finalSurveyResponse.scale_questions || []) {
      questionsToCreate.push({
        survey_id: newSurvey.id,
        order_index: orderIndex++,
        question_type: 'scale_5',
        kit_domain: q.dimension || 'relevance',
        prompt_hebrew: q.prompt,
        is_required: true,
        scale_labels: q.scale_labels || { low: 'לא מסכים כלל', high: 'מסכים לחלוטין' },
        is_generated: true
      });
    }
    
    for (const q of finalSurveyResponse.open_questions || []) {
      questionsToCreate.push({
        survey_id: newSurvey.id,
        order_index: orderIndex++,
        question_type: 'open_text',
        kit_domain: 'none',
        prompt_hebrew: q.prompt,
        is_required: false,
        is_generated: true
      });
    }
    
    const bottomLinePrompts = {
      students: 'האם היית ממליץ/ה לחברים להשתתף בפעילות כזו?',
      parents: 'האם הייתם רוצים שילדכם ישתתף בפעילויות דומות בעתיד?',
      teachers: 'האם הייתם ממליצים להמשיך את הפעילות הזו?',
      management: 'האם יש ערך מוסף לפעילות זו בהשוואה למשאבים המושקעים?'
    };
    
    questionsToCreate.push({
      survey_id: newSurvey.id,
      order_index: orderIndex++,
      question_type: 'bottom_line',
      kit_domain: 'none',
      prompt_hebrew: bottomLinePrompts[useSurvey.audience] || bottomLinePrompts.students,
      is_required: true,
      choices: [
        { value: 'yes', label: 'כן, בהחלט' },
        { value: 'maybe', label: 'אולי' },
        { value: 'no', label: 'לא' }
      ],
      is_generated: true
    });
    
    await base44.entities.SurveyQuestion.bulkCreate(questionsToCreate);
    
    return newSurvey;
  };

  const buildSurveyContext = (survey) => {
    const audienceLabels = { students: 'תלמידים', parents: 'הורים', teachers: 'מורים', management: 'הנהלה' };
    const eventTypeLabels = { single_event: 'אירוע חד פעמי', ongoing_program: 'תוכנית מתמשכת', annual_activity: 'פעילות שנתית קבועה', special_project: 'פרויקט מיוחד' };
    const gradeLabels = { middle: 'חטיבת ביניים (ז׳-ט׳)', high: 'תיכון (י׳-י״ב)', college: 'מכללה (י״ג-י״ד)' };
    const contentFocusLabels = { pedagogical: 'לימודי-פדגוגי', social_emotional: 'חברתי-רגשי', values: 'ערכי', organizational: 'ארגוני-לוגיסטי', community: 'קהילתי' };
    
    const contentFocuses = survey.content_focus || ['pedagogical'];
    const measurementTargets = survey.measurement_targets || {};
    const valuesToMeasure = measurementTargets.selected_values?.join(', ') || '';
    const knowledgeToMeasure = measurementTargets.selected_knowledge?.join(', ') || '';
    const skillsToMeasure = measurementTargets.selected_skills?.join(', ') || '';
    const selectedGrades = survey.grade_range?.selected_grades?.map(g => gradeLabels[g]).join(', ') || '';
    const evaluationGoals = Array.isArray(survey.evaluation_goal) ? survey.evaluation_goal.join(', ') : survey.evaluation_goal || '';
    const successDef = survey.success_definition?.selected_ideas?.join(', ') || survey.success_definition?.custom_text || '';
    const contentFocusDisplay = contentFocuses.map(cf => contentFocusLabels[cf] || cf).join(', ');
    
    return {
      survey_language: survey.language === 'hebrew' ? 'עברית' : 'ערבית',
      activity_description: survey.activity_description || 'לא צוין',
      attached_file: survey.activity_file_url || 'לא צורף קובץ',
      audience: audienceLabels[survey.audience] || survey.audience,
      grades: selectedGrades || 'לא צוין',
      anonymity_type: survey.is_anonymous === false ? 'שמי' : 'אנונימי',
      event_type: eventTypeLabels[survey.event_type] || survey.event_type || 'לא צוין',
      content_focus: contentFocusDisplay,
      values_section: valuesToMeasure ? `ערכים למדידה: ${valuesToMeasure}` : '',
      knowledge_section: knowledgeToMeasure ? `ידע למדידה: ${knowledgeToMeasure}` : '',
      skills_section: skillsToMeasure ? `מיומנויות למדידה: ${skillsToMeasure}` : '',
      goals_section: evaluationGoals ? `מטרות ההערכה: ${evaluationGoals}` : '',
      success_section: successDef ? `הגדרת הצלחה: ${successDef}` : ''
    };
  };

  const buildStep1Prompt = (ctx) => `אתה מנוע פירוש הקשר להערכה בית-ספרית. אתה לא כותב שאלון ולא כותב שאלות.
אתה מתרגם קלט משתמש למפת הערכה קשיחה (allowed/forbidden), כדי שהשלבים הבאים לא יתבלבלו.

קלט:
שפה: ${ctx.survey_language}
תיאור פעילות: ${ctx.activity_description}
קובץ מצורף: ${ctx.attached_file}
קהל יעד: ${ctx.audience}
שכבות גיל: ${ctx.grades}
אנונימיות: ${ctx.anonymity_type}
סוג אירוע: ${ctx.event_type}
תחומי מיקוד: ${ctx.content_focus}
${ctx.values_section}
${ctx.knowledge_section}
${ctx.skills_section}
${ctx.goals_section}
${ctx.success_section}

חוקים:
1) אין למדוד דבר שאין לו עוגן בתיאור פעילות או בקובץ או שמופיע במטרות/הצלחה.
2) תחומי מיקוד הוא מסנן קשיח: תחום שלא נבחר — אסור למדידה.
3) סוג אירוע הוא מסנן זמן קשיח:
   - חד-פעמי: אסור מדדים של שינוי/תהליך לאורך זמן.
   - מתמשך/שנתי: חייב לכלול לפחות מדד אחד תהליכי (תהליך/התקדמות/עקביות).
4) קהל יעד הוא מסנן לגיטימציה:
   - תלמידים: מותר חוויה/משמעות/בהירות/מעורבות/שייכות/קול/קושי; אסור יעילות פדגוגית/ROI/אסטרטגיה.
   - מורים: מותר התאמה למטרות/איכות יישום/תרומה לתלמידים/היתכנות; אסור שאלות חווייתיות כלליות ("נהניתי").
   - הורים: מותר תפיסת תרומה לילד/תקשורת/ביטחון/ערך נתפס; אסור מדידה ישירה של למידה/הוראה.
   - הנהלה: מותר אסטרטגיה/קיימות/סקייל/כדאיות/החלטות המשך; אסור שאלות חוויה סובייקטיבית.
5) אנונימיות קובעת רמת רגישות:
   - שמי: הימנע מביקורת חדה/חשיפה אישית/שאלות שעלולות לאיים.
   - אנונימי: מותר שאלות ביקורתיות.

משימה:
א) הסק intervention_type אחד או שניים: learning / experiential / values / behavioral / organizational / community.
ב) קבע time_logic: one_time / ongoing / yearly.
ג) הפק רשימת dimensions_allowed ורשימת dimensions_forbidden מתוך: knowledge_understanding, skills_application, values_identity, emotional_engagement, relevance, clarity_expectations, delivery_quality, belonging_voice_safety, difficulty_fit, future_intent, process_growth, organizational_logistics, roi_scalability.
ד) לכל ממד מותר, צרף decision_use: improve / preserve / expand / change / stop. אם אין decision_use אפשרי — העבר לממד forbidden.
ה) קבע risk_level: low/medium/high.

החזר JSON בלבד.`;

  const buildStep2Prompt = (contextMap, ctx) => `אתה מתכנן שלד שאלון (Blueprint). אתה לא כותב שאלות.

קלט Context Map:
${JSON.stringify(contextMap, null, 2)}

נתוני סקר:
מטרות: ${ctx.goals_section}
הגדרת הצלחה: ${ctx.success_section}
קהל: ${ctx.audience}
גילאים: ${ctx.grades}
סוג: ${ctx.event_type}

חוקים קשיחים:
1) כמות סטנדרטית: 8–12 שאלות סולם + 3–5 פתוחות.
2) לכל ממד מותר (dimensions_allowed) חייב להיות לפחות פריט אחד בשאלון.
3) אין לכלול ממדים אסורים.
4) פתוחות לא משכפלות סולמות. כל פתוחה חייבת לשרת אחת מהמטרות.
5) אם event_type=ongoing/yearly → כלול לפחות פריט אחד על תהליך/שינוי לאורך זמן.
6) בנה section_order שמכבד זמן משיב: רקע מינימלי → סולמות בלוקים → פתוחות → החלטה/המשך.

בחר סוגי סולם מגוונים: intensity, clarity, frequency, fit, difficulty, usefulness.

משימה:
א) קבע כותרות (sections) לפי ממדים.
ב) עבור כל section הגדר: type, dimension, count, scale_type, inclusion_reason.
ג) הוסף 1–2 שאלות decision שמאפשרות החלטה המשכית.

החזר JSON בלבד.`;

  const buildStep3Prompt = (contextMap, blueprint, ctx) => `אתה כותב שאלות לשאלון לפי Blueprint נתון. אתה לא משנה את המבנה ולא מוסיף ממדים.

Context Map:
${JSON.stringify(contextMap, null, 2)}

Blueprint:
${JSON.stringify(blueprint, null, 2)}

נתוני פעילות:
תיאור: ${ctx.activity_description}
קהל: ${ctx.audience}
גילאים: ${ctx.grades}
אנונימיות: ${ctx.anonymity_type}
שפה: ${ctx.survey_language}

חוקים קשיחים:
1) כל שאלה מודדת דבר אחד בלבד.
2) אל תכתוב היגדי הסכמה. כתוב שאלות דירוג ("עד כמה.../באיזו מידה...").
3) השתמש ב-scale_labels ברורים לקצוות בלבד (low/high).
4) גוון סוגי סולמות לפי scale_type מה-Blueprint.
5) אין חזרתיות רעיונית או ניסוחית.
6) שאלות פתוחות משלימות סולמות: אסור לחזור על אותו ממד באותו ניסוח.
7) אם anonymity_type=שמי: הימנע מניסוחים מאשימים/חושפניים.
8) CRITICAL - התאם לקהל יעד:
   - מורים: אסור שאלות חווייתיות אישיות ("עד כמה חידשה לי ידע"). מותר רק תרומה לתלמידים ואיכות יישום.
   - תלמידים: מותר חוויה אישית. אסור שאלות מערכתיות.

החזר JSON בלבד.`;

  const buildStep4Prompt = (contextMap, blueprint, surveyJson) => `אתה בודק איכות (Quality Gate) לשאלון שנוצר. אם יש בעיות — אתה מתקן, בלי לשנות את ה-Blueprint.

Context Map:
${JSON.stringify(contextMap, null, 2)}

Blueprint:
${JSON.stringify(blueprint, null, 2)}

Survey JSON:
${JSON.stringify(surveyJson, null, 2)}

בדיקות חובה:
1) Forbidden check: אין אף שאלה שמודדת dimension שנמצא ב-dimensions_forbidden.
2) Coverage check: לכל dimension ב-dimensions_allowed יש לפחות שאלה אחת.
3) Duplication check: אין שתי שאלות עם אותו רעיון/ניסוח קרוב.
4) Time logic check: חד-פעמי אין שאלות על שינוי לאורך זמן; מתמשך/שנתי יש לפחות פריט אחד תהליכי.
5) Open/Scale separation: פתוחות לא משכפלות סולמות.
6) Actionability check: לפחות שאלה אחת מאפשרת החלטה (continue/change/stop).
7) Language check: תואם שפה + גיל.
8) Audience check: שאלות מותאמות לקהל - מורים לא מקבלים שאלות חווייתיות אישיות.

משימה:
- אם הכל תקין: החזר את survey_json ללא שינוי.
- אם לא: תקן מינימום הכרחי בלבד והחזר survey_json מתוקן.

החזר רק את scale_questions ו-open_questions מתוקנים.`;

  const buildPromptFromTemplate = (template, survey) => {
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

    const contentFocuses = survey.content_focus || ['pedagogical'];
    const measurementTargets = survey.measurement_targets || {};
    const valuesToMeasure = measurementTargets.selected_values?.join(', ') || '';
    const knowledgeToMeasure = measurementTargets.selected_knowledge?.join(', ') || '';
    const skillsToMeasure = measurementTargets.selected_skills?.join(', ') || '';
    const selectedGrades = survey.grade_range?.selected_grades?.map(g => gradeLabels[g]).join(', ') || '';
    const evaluationGoals = Array.isArray(survey.evaluation_goal) ? survey.evaluation_goal.join(', ') : survey.evaluation_goal || '';
    const successDef = survey.success_definition?.selected_ideas?.join(', ') || survey.success_definition?.custom_text || '';
    const contentFocusDisplay = contentFocuses.map(cf => contentFocusLabels[cf] || cf).join(', ');

    let prompt = template.replace(/{activity_description}/g, survey.activity_description || 'לא צוין');
    prompt = prompt.replace(/{audience}/g, audienceLabels[survey.audience] || survey.audience);
    prompt = prompt.replace(/{grades}/g, selectedGrades || 'לא צוין');
    prompt = prompt.replace(/{event_type}/g, eventTypeLabels[survey.event_type] || survey.event_type || 'לא צוין');
    prompt = prompt.replace(/{content_focus}/g, contentFocusDisplay);
    prompt = prompt.replace(/{values_section}/g, valuesToMeasure ? `• ערכים למדידה: ${valuesToMeasure}` : '');
    prompt = prompt.replace(/{knowledge_section}/g, knowledgeToMeasure ? `• ידע למדידה: ${knowledgeToMeasure}` : '');
    prompt = prompt.replace(/{skills_section}/g, skillsToMeasure ? `• מיומנויות למדידה: ${skillsToMeasure}` : '');
    prompt = prompt.replace(/{goals_section}/g, evaluationGoals ? `• מטרות ההערכה: ${evaluationGoals}` : '');
    prompt = prompt.replace(/{success_section}/g, successDef ? `• הגדרת הצלחה: ${successDef}` : '');

    return prompt;
  };

  const generateWithPrompt = async (prompt, surveyData) => {
    const useSurvey = surveyData || survey;
    
    // Check if this is a 4-step prompt
    const is4Step = prompt.name.includes('4 Steps') || prompt.name.includes('4 שלבים');
    
    if (is4Step) {
      return await generateWith4Steps(prompt, useSurvey);
    }
    
    const builtPrompt = buildPromptFromTemplate(prompt.prompt_text, useSurvey);
    
    // Check if unified prompt (has both scale_questions and open_questions)
    const isUnified = prompt.prompt_text.includes('scale_questions') && prompt.prompt_text.includes('open_questions');
    
    console.log(`Generating with prompt: ${prompt.name}, unified: ${isUnified}`);
    
    let scaleResponse, openResponse;
    
    if (isUnified) {
      // Unified prompt format
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: builtPrompt,
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
      
      console.log('Unified response received:', response);
      scaleResponse = { questions: response.scale_questions || [] };
      openResponse = { questions: response.open_questions || [] };
    } else {
      // Legacy format
      scaleResponse = await base44.integrations.Core.InvokeLLM({
        prompt: builtPrompt,
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
      console.log('Legacy response received:', scaleResponse);
      openResponse = { questions: [] }; // No open questions for legacy prompts
    }

    // Create a duplicate survey
    const newSurvey = await base44.entities.Survey.create({
      ...useSurvey,
      title: `${useSurvey.activity_description?.slice(0, 30) || 'סקר'} - ${prompt.name}`,
      prompt_version: prompt.name,
      status: 'draft'
    });

    // Create questions
    let orderIndex = 0;
    const questionsToCreate = [];
    const bgQuestions = useSurvey.background_questions || {};

    if (useSurvey.is_anonymous === false) {
      questionsToCreate.push({
        survey_id: newSurvey.id,
        order_index: orderIndex++,
        question_type: 'open_text',
        kit_domain: 'none',
        prompt_hebrew: 'מה שמך?',
        is_required: true,
        is_generated: true
      });
    }

    if (bgQuestions.include_class) {
      const selectedGradeRanges = useSurvey.grade_range?.selected_grades || [];
      const gradeChoicesMap = {
        middle: [{ value: 'z', label: 'ז׳' }, { value: 'h', label: 'ח׳' }, { value: 't', label: 'ט׳' }],
        high: [{ value: 'y', label: 'י׳' }, { value: 'ya', label: 'י״א' }, { value: 'yb', label: 'י״ב' }],
        college: [{ value: 'yg', label: 'י״ג' }, { value: 'yd', label: 'י״ד' }]
      };
      const relevantChoices = selectedGradeRanges.flatMap(range => gradeChoicesMap[range] || []);
      questionsToCreate.push({
        survey_id: newSurvey.id,
        order_index: orderIndex++,
        question_type: 'single_choice',
        kit_domain: 'none',
        prompt_hebrew: useSurvey.audience === 'parents' ? 'באיזו כיתה ילדך/ילדתך?' : 'באיזו כיתה את/ה?',
        is_required: true,
        choices: relevantChoices.length > 0 ? relevantChoices : [{ value: 'z', label: 'ז׳' }],
        is_generated: true
      });
    }

    if (bgQuestions.include_gender) {
      questionsToCreate.push({
        survey_id: newSurvey.id,
        order_index: orderIndex++,
        question_type: 'single_choice',
        kit_domain: 'none',
        prompt_hebrew: 'מה המגדר שלך?',
        is_required: true,
        choices: [{ value: 'male', label: 'זכר' }, { value: 'female', label: 'נקבה' }, { value: 'other', label: 'אחר' }],
        is_generated: true
      });
    }

    for (const q of scaleResponse.questions || []) {
      questionsToCreate.push({
        survey_id: newSurvey.id,
        order_index: orderIndex++,
        question_type: 'scale_5',
        kit_domain: q.kit_domain || 'relevance',
        prompt_hebrew: q.prompt,
        is_required: true,
        scale_labels: q.scale_labels || { low: 'לא מסכים כלל', high: 'מסכים לחלוטין' },
        is_generated: true
      });
    }

    // Add open questions
    for (const q of openResponse.questions || []) {
      questionsToCreate.push({
        survey_id: newSurvey.id,
        order_index: orderIndex++,
        question_type: 'open_text',
        kit_domain: 'none',
        prompt_hebrew: q.prompt,
        is_required: false,
        is_generated: true
      });
    }

    const bottomLinePrompts = {
      students: 'האם היית ממליץ/ה לחברים להשתתף בפעילות כזו?',
      parents: 'האם הייתם רוצים שילדכם ישתתף בפעילויות דומות בעתיד?',
      teachers: 'האם הייתם ממליצים להמשיך את הפעילות הזו?',
      management: 'האם יש ערך מוסף לפעילות זו בהשוואה למשאבים המושקעים?'
    };

    questionsToCreate.push({
      survey_id: newSurvey.id,
      order_index: orderIndex++,
      question_type: 'bottom_line',
      kit_domain: 'none',
      prompt_hebrew: bottomLinePrompts[useSurvey.audience] || bottomLinePrompts.students,
      is_required: true,
      choices: [
        { value: 'yes', label: 'כן, בהחלט' },
        { value: 'maybe', label: 'אולי' },
        { value: 'no', label: 'לא' }
      ],
      is_generated: true
    });

    await base44.entities.SurveyQuestion.bulkCreate(questionsToCreate);

    return newSurvey;
  };

  const startGeneration = async (prompts, surveyData) => {
    if (!prompts || prompts.length === 0 || !surveyData) {
      console.log('Cannot generate:', { promptsLength: prompts?.length, hasSurvey: !!surveyData });
      toast.error('חסרים נתונים ליצירת סקרים');
      return;
    }

    console.log(`Starting generation with ${prompts.length} prompts`);
    setIsGenerating(true);
    const results = [];

    try {
      for (let i = 0; i < prompts.length; i++) {
        console.log(`Generating version ${i + 1}/${prompts.length}`);
        setCurrentPromptIndex(i);
        const newSurvey = await generateWithPrompt(prompts[i], surveyData);
        results.push({ prompt: prompts[i].name, survey: newSurvey, promptNotes: prompts[i].notes });
        console.log(`Version ${i + 1} created successfully`);
      }

      console.log(`All ${results.length} versions generated successfully`);
      setGeneratedSurveys(results);
      setSelectedVersions(results.map((_, idx) => idx));
      setIsComplete(true);
      toast.success(`נוצרו ${results.length} גרסאות סקר!`);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(`שגיאה ביצירת הסקרים: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleVersion = (index) => {
    setSelectedVersions(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const deleteUnselected = async () => {
    if (!confirm('למחוק את הגרסאות שלא נבחרו?')) return;
    
    const toDelete = generatedSurveys
      .filter((_, idx) => !selectedVersions.includes(idx))
      .map(g => g.survey.id);
    
    for (const id of toDelete) {
      await base44.entities.Survey.delete(id);
    }
    
    setGeneratedSurveys(prev => prev.filter((_, idx) => selectedVersions.includes(idx)));
    toast.success('גרסאות נמחקו');
  };

  const viewVersion = (versionData) => {
    setViewingVersion(versionData);
  };

  const backToAll = () => {
    setViewingVersion(null);
  };

  if (viewingVersion) {
    // Compare mode
    if (viewingVersion.compare) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white p-6">
          <div className="max-w-7xl mx-auto">
            <Button
              onClick={backToAll}
              variant="outline"
              className="mb-6"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה לכל הגרסאות
            </Button>

            <h1 className="text-2xl font-bold text-[#6B2D4A] mb-6">
              השוואת {viewingVersion.versions.length} גרסאות
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {viewingVersion.versions.map(({ prompt, survey, promptNotes }, idx) => (
                <div key={survey.id} className="space-y-4">
                  <Card className="border-[#E85A24] sticky top-4">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">גרסה {idx + 1}</CardTitle>
                          <p className="text-sm text-gray-500 mb-2">
                            <span className="font-medium text-[#E85A24]">{prompt}</span>
                          </p>
                          {promptNotes && (
                            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              {promptNotes}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => navigate(createPageUrl('SurveyEditor') + `?surveyId=${survey.id}`)}
                          size="sm"
                          className="bg-[#E85A24] hover:bg-[#D14A1A]"
                        >
                          ערוך
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>

                  <SurveyPreview surveyId={survey.id} />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Single view mode
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={backToAll}
            variant="outline"
            className="mb-6"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזרה לכל הגרסאות
          </Button>

          <Card className="border-[#E85A24] mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{viewingVersion.survey.title}</CardTitle>
                  <p className="text-sm text-gray-500 mb-2">
                    נוצר בעזרת: <span className="font-medium text-[#E85A24]">{viewingVersion.prompt}</span>
                  </p>
                  {viewingVersion.promptNotes && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {viewingVersion.promptNotes}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => navigate(createPageUrl('SurveyEditor') + `?surveyId=${viewingVersion.survey.id}`)}
                  className="bg-[#E85A24] hover:bg-[#D14A1A]"
                >
                  <FileText className="w-4 h-4 ml-2" />
                  ערוך סקר
                </Button>
              </div>
            </CardHeader>
          </Card>

          <SurveyPreview surveyId={viewingVersion.survey.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {!isGenerating && !isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-12 h-12 text-[#E85A24] animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-[#6B2D4A] mb-4">
                מכין ליצירה...
              </h1>
              <p className="text-gray-500">
                טוען פרומפטים ומתחיל ביצירת הסקרים
              </p>
            </motion.div>
          )}

          {isGenerating && !isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-12 h-12 text-[#E85A24] animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-[#6B2D4A] mb-4">
                יוצר גרסה {currentPromptIndex + 1} מתוך {activePrompts.length}
              </h1>
              <p className="text-gray-500">
                {activePrompts[currentPromptIndex]?.name}
              </p>
            </motion.div>
          )}

          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-[#6B2D4A]">
                    {generatedSurveys.length} גרסאות נוצרו בהצלחה!
                  </h1>
                  <p className="text-gray-500 mt-1">
                    {selectedVersions.length} גרסאות נבחרו • השווה ובחר את הגרסה המתאימה ביותר
                  </p>
                </div>
                {selectedVersions.length < generatedSurveys.length && (
                  <Button
                    onClick={deleteUnselected}
                    variant="outline"
                    className="text-red-600 border-red-600"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    מחק לא נבחרו
                  </Button>
                )}
              </div>

              <div className="mb-6">
                {selectedVersions.length >= 2 && (
                  <div className="mb-4 flex gap-2">
                    <Button
                      onClick={() => {
                        const selected = generatedSurveys.filter((_, idx) => selectedVersions.includes(idx));
                        if (selected.length >= 2) {
                          setViewingVersion({ compare: true, versions: selected });
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      השווה {selectedVersions.length} גרסאות נבחרות
                    </Button>
                  </div>
                )}
                
                <div className="grid gap-4">
                  {generatedSurveys.map(({ prompt, survey }, idx) => {
                    const isSelected = selectedVersions.includes(idx);
                    return (
                      <Card 
                        key={survey.id} 
                        className={`border-2 transition-all ${isSelected ? 'border-green-400 bg-green-50' : 'border-gray-200 opacity-60'}`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <Switch
                                checked={isSelected}
                                onCheckedChange={() => toggleVersion(idx)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <CardTitle className="text-lg">גרסה {idx + 1}</CardTitle>
                                  <span className="text-xs text-white bg-[#E85A24] px-2 py-1 rounded-full">
                                    {prompt}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{survey.title}</p>
                                {generatedSurveys[idx].promptNotes && (
                                  <p className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded">
                                    {generatedSurveys[idx].promptNotes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex gap-2">
                          <Button
                            onClick={() => viewVersion({ prompt, survey, promptNotes: generatedSurveys[idx].promptNotes })}
                            variant="outline"
                            className="flex-1"
                          >
                            <Eye className="w-4 h-4 ml-2" />
                            צפה בגרסה
                          </Button>
                          <Button
                            onClick={() => navigate(createPageUrl('SurveyEditor') + `?surveyId=${survey.id}`)}
                            className="flex-1 bg-[#E85A24] hover:bg-[#D14A1A]"
                          >
                            <FileText className="w-4 h-4 ml-2" />
                            ערוך
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={() => navigate(createPageUrl('Home'))}
                variant="outline"
                className="mx-auto block"
              >
                חזור לדף הבית
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}