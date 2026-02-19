import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle, FileText, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

const KIT_MAPPING = {
  pedagogical: ['relevance', 'skills', 'delivery_quality'],
  social_emotional: ['belonging', 'relevance', 'delivery_quality'],
  values: ['belonging', 'relevance'],
  organizational: ['relevance', 'delivery_quality'],
  community: ['belonging', 'relevance']
};

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

const bottomLinePrompts = {
  students: 'האם היית ממליץ/ה לחברים להשתתף בפעילות כזו?',
  parents: 'האם הייתם רוצים שילדכם ישתתף בפעילויות דומות בעתיד?',
  teachers: 'האם הייתם ממליצים להמשיך את הפעילות הזו?',
  management: 'האם יש ערך מוסף לפעילות זו בהשוואה למשאבים המושקעים?'
};

function buildPromptFromSurvey(promptTemplate, survey) {
  const valuesToMeasure = survey.measurement_targets?.selected_values?.join(', ') || '';
  const knowledgeToMeasure = survey.measurement_targets?.selected_knowledge?.join(', ') || '';
  const skillsToMeasure = survey.measurement_targets?.selected_skills?.join(', ') || '';
  const selectedGrades = survey.grade_range?.selected_grades?.map(g => gradeLabels[g]).join(', ') || '';
  const evaluationGoals = Array.isArray(survey.evaluation_goal) ? survey.evaluation_goal.join(', ') : survey.evaluation_goal || '';
  const successDef = survey.success_definition?.selected_ideas?.join(', ') || survey.success_definition?.custom_text || '';
  const contentFocusDisplay = (survey.content_focus || []).map(cf => contentFocusLabels[cf] || cf).join(', ');

  let customPrompt = promptTemplate;
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

  const studentLanguageSection = survey.audience === 'students' ? `\n• גוף שני (את/ה) - לא גוף ראשון (אני)\n• שפה פשוטה וידידותית` : '';
  customPrompt = customPrompt.replace(/{student_language_section}/g, studentLanguageSection);

  const audienceLanguage = survey.audience === 'students' ? 'שפה פשוטה בגוף שני (את/ה)' : 'שפה מקצועית מכבדת';
  customPrompt = customPrompt.replace(/{audience_language}/g, audienceLanguage);

  const ongoingNote = survey.event_type === 'ongoing_program' ? 'התייחס לתהליך המתמשך, לא רק לאירוע בודד' : '';
  customPrompt = customPrompt.replace(/{ongoing_note}/g, ongoingNote);

  return customPrompt;
}

async function generateSurveyForPrompt(baseSurveyId, survey, promptObj) {
  const prompt = buildPromptFromSurvey(promptObj.prompt_text, survey);

  // Use a flexible schema that accommodates both prompt formats
  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: "object",
      properties: {
        // Format A: simple (פרומפט מאוחד)
        scale_questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              prompt: { type: "string" },
              kit_domain: { type: "string" },
              scale_labels: {
                type: "object",
                properties: { low: { type: "string" }, high: { type: "string" } }
              }
            }
          }
        },
        open_questions: {
          type: "array",
          items: { type: "object", properties: { prompt: { type: "string" } } }
        },
        // Format B: structured (3V / YUVAL prompts)
        SURVEY_CONTENT: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  text: { type: "string" },
                  type: { type: "string" },
                  section: { type: "string" },
                  scale_labels: { type: "object" },
                  tags: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      }
    }
  });

  // Normalize to scale_questions / open_questions regardless of prompt format
  let scaleQuestions = result.scale_questions || [];
  let openQuestions = result.open_questions || [];

  // Handle 3V / YUVAL format: SURVEY_CONTENT.questions array
  if ((!scaleQuestions.length && !openQuestions.length) && result.SURVEY_CONTENT?.questions?.length) {
    const allQ = result.SURVEY_CONTENT.questions;
    scaleQuestions = allQ
      .filter(q => q.type === 'likert_1_5' || q.type === 'likert' || q.section === 'scale_section')
      .map(q => ({
        prompt: q.text,
        kit_domain: q.tags?.[0] || 'relevance',
        scale_labels: q.scale_labels
          ? { low: q.scale_labels['1'] || 'לא מסכים', high: q.scale_labels['5'] || 'מסכים מאוד' }
          : { low: 'לא מסכים כלל', high: 'מסכים לחלוטין' }
      }));
    openQuestions = allQ
      .filter(q => q.type === 'open_text' && q.section !== 'bottom_line')
      .map(q => ({ prompt: q.text }));
  }

  // Create a new Survey record (clone of the base survey)
  const newSurvey = await base44.entities.Survey.create({
    ...survey,
    id: undefined,
    title: (survey.activity_description?.slice(0, 40) || 'סקר משוב') + ` — ${promptObj.name}`,
    prompt_version: promptObj.name,
    status: 'draft',
    current_step: 'B3',
    last_autosave: new Date().toISOString()
  });

  const newSurveyId = newSurvey.id;
  let orderIndex = 0;
  const questionsToCreate = [];

  const bgQuestions = survey.background_questions || {};
  if (survey.is_anonymous === false) {
    questionsToCreate.push({ survey_id: newSurveyId, order_index: orderIndex++, question_type: 'open_text', kit_domain: 'none', prompt_hebrew: 'מה שמך?', is_required: true, is_generated: true });
  }

  if (bgQuestions.include_class) {
    const selectedGradeRanges = survey.grade_range?.selected_grades || [];
    const gradeChoicesMap = {
      middle: [{ value: 'z', label: 'ז׳' }, { value: 'h', label: 'ח׳' }, { value: 't', label: 'ט׳' }],
      high: [{ value: 'y', label: 'י׳' }, { value: 'ya', label: 'י״א' }, { value: 'yb', label: 'י״ב' }],
      college: [{ value: 'yg', label: 'י״ג' }, { value: 'yd', label: 'י״ד' }]
    };
    const relevantChoices = selectedGradeRanges.flatMap(range => gradeChoicesMap[range] || []);
    questionsToCreate.push({ survey_id: newSurveyId, order_index: orderIndex++, question_type: 'single_choice', kit_domain: 'none', prompt_hebrew: survey.audience === 'parents' ? 'באיזו כיתה ילדך/ילדתך?' : 'באיזו כיתה את/ה?', is_required: true, choices: relevantChoices.length > 0 ? relevantChoices : [{ value: 'z', label: 'ז׳' }], is_generated: true });
  }

  if (bgQuestions.include_gender) {
    questionsToCreate.push({ survey_id: newSurveyId, order_index: orderIndex++, question_type: 'single_choice', kit_domain: 'none', prompt_hebrew: 'מה המגדר שלך?', is_required: true, choices: [{ value: 'male', label: 'זכר' }, { value: 'female', label: 'נקבה' }, { value: 'other', label: 'אחר' }], is_generated: true });
  }

  if (bgQuestions.include_subject) {
    questionsToCreate.push({ survey_id: newSurveyId, order_index: orderIndex++, question_type: 'open_text', kit_domain: 'none', prompt_hebrew: 'מה המקצוע/ות שאת/ה מלמד/ת?', is_required: true, is_generated: true });
  }

  if (bgQuestions.include_role) {
    questionsToCreate.push({ survey_id: newSurveyId, order_index: orderIndex++, question_type: 'open_text', kit_domain: 'none', prompt_hebrew: 'מה תפקידך בהנהלה?', is_required: true, is_generated: true });
  }

  for (const q of scaleQuestions) {
    questionsToCreate.push({ survey_id: newSurveyId, order_index: orderIndex++, question_type: 'scale_5', kit_domain: q.kit_domain || 'relevance', prompt_hebrew: q.prompt, is_required: true, scale_labels: q.scale_labels || { low: 'לא מסכים כלל', high: 'מסכים לחלוטין' }, is_generated: true });
  }

  for (const q of openQuestions) {
    questionsToCreate.push({ survey_id: newSurveyId, order_index: orderIndex++, question_type: 'open_text', kit_domain: 'none', prompt_hebrew: q.prompt, is_required: false, is_generated: true });
  }

  questionsToCreate.push({ survey_id: newSurveyId, order_index: orderIndex++, question_type: 'bottom_line', kit_domain: 'none', prompt_hebrew: bottomLinePrompts[survey.audience] || bottomLinePrompts.students, is_required: true, choices: [{ value: 'yes', label: 'כן, בהחלט' }, { value: 'maybe', label: 'אולי' }, { value: 'no', label: 'לא' }], is_generated: true });

  await base44.entities.SurveyQuestion.bulkCreate(questionsToCreate);

  const introResponse = await base44.integrations.Core.InvokeLLM({
    prompt: `כתוב פסקת פתיחה קצרה (2-3 משפטים) לסקר משוב על: ${survey.activity_description}. ידידותית, מסבירה מטרת הסקר, מבטיחה אנונימיות. קהל: ${survey.audience}`,
    response_json_schema: { type: "object", properties: { intro: { type: "string" } } }
  });

  await base44.entities.Survey.update(newSurveyId, {
    intro_text: introResponse.intro,
  });

  return newSurveyId;
}

export default function GenerateSurvey() {
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [baseSurveyId, setBaseSurveyId] = useState(null);
  const [activePrompts, setActivePrompts] = useState([]);
  const [promptReady, setPromptReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVersions, setGeneratedVersions] = useState([]); // [{surveyId, promptName, done, error}]
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('surveyId');
      if (!id) return;
      setBaseSurveyId(id);

      const [surveys, prompts] = await Promise.all([
        base44.entities.Survey.filter({ id }),
        base44.entities.AdminPrompt.filter({ is_active: true })
      ]);

      if (surveys.length > 0) setSurvey(surveys[0]);

      const active = prompts.filter(p => p.is_active);
      setActivePrompts(active);
      setPromptReady(true);
    };
    loadData();
  }, []);

  const generateAll = async () => {
    if (!survey || activePrompts.length === 0) return;
    setIsGenerating(true);

    const versions = activePrompts.map(p => ({ promptId: p.id, promptName: p.name, surveyId: null, done: false, error: false }));
    setGeneratedVersions(versions);

    // Generate all in parallel
    const results = await Promise.allSettled(
      activePrompts.map((p) => generateSurveyForPrompt(baseSurveyId, survey, p))
    );

    const updated = versions.map((v, i) => {
      if (results[i].status === 'fulfilled') {
        return { ...v, surveyId: results[i].value, done: true };
      } else {
        console.error(`Error for prompt ${v.promptName}:`, results[i].reason);
        return { ...v, done: true, error: true };
      }
    });

    setGeneratedVersions(updated);
    setAllDone(true);
    setIsGenerating(false);
    toast.success('כל הגרסאות נוצרו!');
  };

  const handleOpenVersion = (surveyId) => {
    navigate(createPageUrl('SurveyEditor') + `?surveyId=${surveyId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full text-center">
        <AnimatePresence mode="wait">

          {/* Loading prompts */}
          {!promptReady && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Loader2 className="w-12 h-12 text-[#E85A24] animate-spin mx-auto" />
              <p className="text-gray-500 mt-4">טוען נתונים...</p>
            </motion.div>
          )}

          {/* Ready state */}
          {promptReady && !isGenerating && !allDone && (
            <motion.div key="ready" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="w-full">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-[#E85A24]" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#6B2D4A] mb-2">הכל מוכן ליצירת הסקר</h1>

              {activePrompts.length > 1 ? (
                <p className="text-gray-500 mb-2">
                  נמצאו <strong>{activePrompts.length} פרומפטים פעילים</strong> — המערכת תיצור <strong>{activePrompts.length} גרסאות במקביל</strong> לצורך השוואה.
                </p>
              ) : activePrompts.length === 1 ? (
                <p className="text-gray-500 mb-2">פרומפט פעיל: <strong>{activePrompts[0].name}</strong></p>
              ) : (
                <p className="text-gray-500 mb-2">אין פרומפטים פעילים — יש להפעיל פרומפט באזור הניהול.</p>
              )}

              {activePrompts.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  {activePrompts.map((p, i) => (
                    <span key={p.id} className="bg-orange-100 text-[#E85A24] text-sm px-3 py-1 rounded-full font-medium">
                      גרסה {i + 1}: {p.name}
                    </span>
                  ))}
                </div>
              )}

              <Button
                onClick={generateAll}
                disabled={activePrompts.length === 0}
                className="px-8 py-6 bg-[#E85A24] hover:bg-[#D14A1A] text-white text-lg font-medium rounded-xl shadow-lg shadow-orange-200"
              >
                <Sparkles className="w-5 h-5 ml-2" />
                {activePrompts.length > 1 ? `צור ${activePrompts.length} גרסאות` : 'צור סקר'}
              </Button>
            </motion.div>
          )}

          {/* Generating */}
          {isGenerating && (
            <motion.div key="generating" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-12 h-12 text-[#E85A24] animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-[#6B2D4A] mb-4">
                יוצר {activePrompts.length} גרסאות במקביל...
              </h1>
              <div className="space-y-3 max-w-xs mx-auto text-right">
                {generatedVersions.map((v, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-[#E85A24] animate-spin flex-shrink-0" />
                    <span className="text-gray-700">גרסה {i + 1}: {v.promptName}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Done */}
          {allDone && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#6B2D4A] mb-2">
                {generatedVersions.length > 1 ? `${generatedVersions.filter(v => !v.error).length} גרסאות נוצרו!` : 'הסקר נוצר בהצלחה!'}
              </h1>
              <p className="text-gray-500 mb-8">בחר גרסה לעריכה — בסוף תוכל לדרג אותה ולשתף משוב</p>

              <div className="space-y-3">
                {generatedVersions.map((v, i) => (
                  <div key={i} className={`rounded-xl border-2 p-4 flex items-center justify-between ${v.error ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-white'}`}>
                    <div className="text-right">
                      <p className="font-semibold text-[#6B2D4A]">גרסה {i + 1}</p>
                      <p className="text-sm text-gray-500">{v.promptName}</p>
                      {v.error && <p className="text-xs text-red-500">שגיאה ביצירה</p>}
                    </div>
                    {!v.error && (
                      <Button
                        onClick={() => handleOpenVersion(v.surveyId)}
                        className="bg-[#E85A24] hover:bg-[#D14A1A] text-white"
                      >
                        <FileText className="w-4 h-4 ml-1" />
                        פתח
                        <ChevronLeft className="w-4 h-4 mr-1" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}