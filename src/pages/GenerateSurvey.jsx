import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle, FileText, ChevronLeft, Star, Eye, Trophy, ArrowRight, Layers } from 'lucide-react';
import { toast } from 'sonner';
import SurveyPreview from '../components/SurveyPreview';
import PromptFeedbackBox from '../components/PromptFeedbackBox';

const audienceLabels = { students: 'תלמידים', parents: 'הורים', teachers: 'מורים', management: 'הנהלה' };
const eventTypeLabels = { single_event: 'אירוע חד פעמי', ongoing_program: 'תוכנית מתמשכת', annual_activity: 'פעילות שנתית קבועה', special_project: 'פרויקט מיוחד' };
const gradeLabels = { middle: 'חטיבת ביניים (ז׳-ט׳)', high: 'תיכון (י׳-י״ב)', college: 'מכללה (י״ג-י״ד)' };
const contentFocusLabels = { pedagogical: 'לימודי-פדגוגי', social_emotional: 'חברתי-רגשי', values: 'ערכי', organizational: 'ארגוני-לוגיסטי', community: 'קהילתי' };
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

  // Append survey intake as JSON at end of prompt for structured prompts (3V, YUVAL)
  const surveyIntakeJson = JSON.stringify({
    language: survey.language || 'hebrew',
    activity_description: survey.activity_description || '',
    audience: audienceLabels[survey.audience] || survey.audience,
    grade_range: selectedGrades,
    event_type: eventTypeLabels[survey.event_type] || survey.event_type,
    content_focus: contentFocusDisplay,
    measurement_targets: { values: valuesToMeasure, knowledge: knowledgeToMeasure, skills: skillsToMeasure },
    evaluation_goal: evaluationGoals,
    success_definition: successDef,
    is_anonymous: survey.is_anonymous !== false,
    background_questions: survey.background_questions || {}
  }, null, 2);

  let customPrompt = promptTemplate;
  // Replace template variables if prompt uses them
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

  // Append intake JSON for structured prompts
  customPrompt += `\n\n---\nSURVEY INTAKE (JSON):\n${surveyIntakeJson}`;

  return customPrompt;
}

async function generateSurveyForPrompt(survey, promptObj) {
  const prompt = buildPromptFromSurvey(promptObj.prompt_text, survey);

  // Ask LLM to always output in a normalized format regardless of prompt style
  const normalizedPrompt = prompt + `

---
‼️ IMPORTANT OUTPUT INSTRUCTION (OVERRIDE ALL ABOVE FORMAT INSTRUCTIONS):
Regardless of any output format mentioned above, you MUST return a JSON object with exactly these two keys:
{
  "scale_questions": [
    { "prompt": "question text", "scale_labels": {"low": "label", "high": "label"}, "kit_domain": "relevance|skills|delivery_quality|belonging" }
    // exactly 10 items
  ],
  "open_questions": [
    { "prompt": "open question text" }
    // 3-4 items
  ]
}
Do not wrap in SURVEY_JSON, SURVEY_CONTENT, or any other key. Only scale_questions and open_questions at the root level.`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: normalizedPrompt,
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
                properties: { low: { type: "string" }, high: { type: "string" } }
              }
            }
          }
        },
        open_questions: {
          type: "array",
          items: { type: "object", properties: { prompt: { type: "string" } } }
        }
      }
    }
  });

  console.log('LLM raw result keys:', Object.keys(result));
  console.log('scale_questions count:', result.scale_questions?.length);
  console.log('SURVEY_CONTENT questions:', result.SURVEY_CONTENT?.questions?.length);
  console.log('SURVEY_JSON questions:', result.SURVEY_JSON?.questions?.length);

  // Normalize to scale_questions / open_questions regardless of prompt format
  let scaleQuestions = result.scale_questions || [];
  let openQuestions = result.open_questions || [];

  const isScaleType = (type) => !type || type === 'likert_1_5' || type === 'likert' || type === 'scale' || type.includes('likert') || type.includes('scale');
  const isOpenType = (type) => type === 'open_text' || type === 'open' || type === 'text';

  // Handle 3V format: SURVEY_CONTENT.questions
  if (!scaleQuestions.length && result.SURVEY_CONTENT?.questions?.length) {
    const allQ = result.SURVEY_CONTENT.questions;
    scaleQuestions = allQ
      .filter(q => isScaleType(q.type) || q.section === 'scale_section')
      .map(q => ({
        prompt: q.text || q.prompt,
        kit_domain: q.tags?.[0] || 'relevance',
        scale_labels: q.scale_labels
          ? { low: q.scale_labels['1'] || q.scale_labels.low || 'לא מסכים', high: q.scale_labels['5'] || q.scale_labels.high || 'מסכים מאוד' }
          : { low: 'לא מסכים כלל', high: 'מסכים לחלוטין' }
      }));
    if (!openQuestions.length) {
      openQuestions = allQ
        .filter(q => isOpenType(q.type) && q.section !== 'bottom_line')
        .map(q => ({ prompt: q.text || q.prompt }));
    }
  }

  // Handle YUVAL format: SURVEY_JSON.questions
  if (!scaleQuestions.length && result.SURVEY_JSON?.questions?.length) {
    const allQ = result.SURVEY_JSON.questions;
    scaleQuestions = allQ
      .filter(q => isScaleType(q.type))
      .map(q => ({
        prompt: q.text || q.prompt,
        kit_domain: q.tags?.[0] || 'relevance',
        scale_labels: { low: 'לא מסכים כלל', high: 'מסכים לחלוטין' }
      }));
    if (!openQuestions.length) {
      openQuestions = allQ
        .filter(q => isOpenType(q.type))
        .map(q => ({ prompt: q.text || q.prompt }));
    }
  }

  // Last resort: if still empty, try to pull any questions from any array in result
  if (!scaleQuestions.length) {
    console.warn('No scale questions found via normal paths — trying fallback');
    const allArrays = Object.values(result).filter(Array.isArray);
    for (const arr of allArrays) {
      const candidates = arr.filter(q => q && (q.prompt || q.text));
      if (candidates.length >= 5) {
        scaleQuestions = candidates.slice(0, 10).map(q => ({
          prompt: q.prompt || q.text,
          kit_domain: q.kit_domain || q.tags?.[0] || 'relevance',
          scale_labels: q.scale_labels || { low: 'לא מסכים כלל', high: 'מסכים לחלוטין' }
        }));
        break;
      }
    }
  }

  console.log(`Resolved: ${scaleQuestions.length} scale, ${openQuestions.length} open`);

  // Normalize open_questions (some use "text" instead of "prompt")
  openQuestions = openQuestions.map(q => ({ prompt: q.prompt || q.text || '' })).filter(q => q.prompt);

  // Create a new Survey record as 'candidate' — not yet chosen by the user
  const newSurvey = await base44.entities.Survey.create({
    ...survey,
    id: undefined,
    title: (survey.activity_description?.slice(0, 40) || 'סקר משוב') + ` — ${promptObj.name}`,
    prompt_version: promptObj.name,
    status: 'candidate',
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
    questionsToCreate.push({ survey_id: newSurveyId, order_index: orderIndex++, question_type: 'scale_5', kit_domain: q.kit_domain || q.dimension || 'relevance', prompt_hebrew: q.prompt, is_required: true, scale_labels: q.scale_labels || { low: 'לא מסכים כלל', high: 'מסכים לחלוטין' }, is_generated: true });
  }

  for (const q of openQuestions) {
    questionsToCreate.push({ survey_id: newSurveyId, order_index: orderIndex++, question_type: 'open_text', kit_domain: 'none', prompt_hebrew: q.prompt, is_required: false, is_generated: true });
  }

  questionsToCreate.push({ survey_id: newSurveyId, order_index: orderIndex++, question_type: 'bottom_line', kit_domain: 'none', prompt_hebrew: bottomLinePrompts[survey.audience] || bottomLinePrompts.students, is_required: true, choices: [{ value: 'yes', label: 'כן, בהחלט' }, { value: 'maybe', label: 'אולי' }, { value: 'no', label: 'לא' }], is_generated: true });

  await base44.entities.SurveyQuestion.bulkCreate(questionsToCreate);

  const isAnon = survey.is_anonymous !== false;
  const introResponse = await base44.integrations.Core.InvokeLLM({
    prompt: `כתוב פסקת פתיחה קצרה (2-3 משפטים) לסקר משוב על: ${survey.activity_description}. ידידותית, מסבירה מטרת הסקר${isAnon ? ', מבטיחה שהתשובות אנונימיות' : ', ציין שהסקר הוא נוכחות שמית (לא אנונימי)'}. קהל: ${audienceLabels[survey.audience] || survey.audience}`,
    response_json_schema: { type: "object", properties: { intro: { type: "string" } } }
  });

  await base44.entities.Survey.update(newSurveyId, { intro_text: introResponse.intro });

  return newSurveyId;
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function GenerateSurvey() {
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [baseSurveyId, setBaseSurveyId] = useState(null);
  const [activePrompts, setActivePrompts] = useState([]);

  // Stages: 'explain' | 'generating' | 'review' | 'view_version'
  const [stage, setStage] = useState('loading');
  const [versions, setVersions] = useState([]); // [{promptName, surveyId, done, error}]
  const [viewingIndex, setViewingIndex] = useState(null);
  const [chosenIndex, setChosenIndex] = useState(null);

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
      setActivePrompts(prompts.filter(p => p.is_active));
      setStage('explain');
    };
    loadData();
  }, []);

  const startGeneration = async () => {
    if (!survey || activePrompts.length === 0) return;

    const initial = activePrompts.map(p => ({ promptName: p.name, surveyId: null, done: false, error: false, errorMsg: '' }));
    setVersions(initial);
    setStage('generating');

    // Generate one at a time to avoid timeout issues with large prompts
    const updated = [...initial];
    for (let i = 0; i < activePrompts.length; i++) {
      try {
        console.log(`Generating version ${i + 1}: ${activePrompts[i].name}`);
        const surveyId = await generateSurveyForPrompt(survey, activePrompts[i]);
        updated[i] = { ...updated[i], surveyId, done: true };
        console.log(`Version ${i + 1} done: ${surveyId}`);
      } catch (err) {
        console.error(`Version ${i + 1} failed:`, err);
        updated[i] = { ...updated[i], done: true, error: true, errorMsg: err?.message || 'שגיאה לא ידועה' };
      }
      setVersions([...updated]);
    }

    setStage('review');
    const successCount = updated.filter(v => !v.error).length;
    toast.success(`${successCount} גרסאות נוצרו בהצלחה!`);
  };

  const handleChoose = (index) => {
    setChosenIndex(index);
  };

  const handlePublishChosen = async () => {
    if (chosenIndex === null) return;
    const chosen = versions[chosenIndex];
    // Promote chosen to 'draft', keep others as 'candidate'
    await base44.entities.Survey.update(chosen.surveyId, { status: 'draft' });
    navigate(createPageUrl('SurveyEditor') + `?surveyId=${chosen.surveyId}`);
  };

  // ── LOADING ──
  if (stage === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#E85A24] animate-spin" />
      </div>
    );
  }

  // ── VIEW SINGLE VERSION ──
  if (stage === 'view_version' && viewingIndex !== null) {
    const v = versions[viewingIndex];
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="text-right">
              <p className="font-bold text-[#6B2D4A]">גרסה {viewingIndex + 1}</p>
              <p className="text-xs text-gray-500">{v.promptName}</p>
            </div>
            <Button
              onClick={() => { setChosenIndex(viewingIndex); setStage('review'); }}
              className="bg-[#E85A24] hover:bg-[#D14A1A] text-white text-sm"
            >
              <Trophy className="w-4 h-4 ml-1" />
              בחר גרסה זו
            </Button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          <SurveyPreview surveyId={v.surveyId} />

          {/* Feedback + actions at the bottom */}
          <div className="mt-8 space-y-4">
            <PromptFeedbackBox
              surveyId={v.surveyId}
              promptName={v.promptName}
              audience={survey?.audience}
              activityDescription={survey?.activity_description}
            />

            <Button
              onClick={() => navigate(createPageUrl('SurveyEditor') + `?surveyId=${v.surveyId}`)}
              variant="outline"
              className="w-full"
            >
              <FileText className="w-4 h-4 ml-2" />
              פתח בעורך לעריכה ידנית
            </Button>

            <Button
              onClick={() => setStage('review')}
              variant="ghost"
              className="w-full text-gray-500 hover:text-[#6B2D4A]"
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה לכל הגרסאות
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white flex items-center justify-center px-4 py-8">
      <div className="max-w-xl w-full">
        <AnimatePresence mode="wait">

          {/* ── EXPLAIN STAGE ── */}
          {stage === 'explain' && (
            <motion.div key="explain" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Layers className="w-10 h-10 text-[#E85A24]" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#6B2D4A] mb-3">
                מוכן! הנה מה שיקרה עכשיו
              </h1>
              <p className="text-gray-500 text-lg mb-8">
                המערכת תיצור <strong className="text-[#6B2D4A]">{activePrompts.length} גרסאות</strong> שונות של הסקר במקביל, כל אחת עם גישה ייחודית לשאלות.
              </p>

              <div className="space-y-3 mb-8 text-right">
                {[
                  { num: '1', text: 'המערכת מייצרת 3 גרסאות סקר במקביל, כל אחת עם מתודולוגיה שונה' },
                  { num: '2', text: 'אתה צופה בכל גרסה בנפרד, קורא את השאלות ומדרג' },
                  { num: '3', text: 'בסוף בוחר את הגרסה שאהבת לפרסום' },
                ].map(step => (
                  <div key={step.num} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border border-orange-100">
                    <div className="w-8 h-8 bg-[#E85A24] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm">
                      {step.num}
                    </div>
                    <p className="text-gray-700 pt-1">{step.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {activePrompts.map((p, i) => (
                  <span key={p.id} className="bg-orange-100 text-[#E85A24] text-sm px-3 py-1.5 rounded-full font-medium">
                    גרסה {i + 1}: {p.name}
                  </span>
                ))}
              </div>

              <Button
                onClick={startGeneration}
                disabled={activePrompts.length === 0}
                className="w-full py-6 bg-[#E85A24] hover:bg-[#D14A1A] text-white text-lg font-medium rounded-xl shadow-lg shadow-orange-200"
              >
                <Sparkles className="w-5 h-5 ml-2" />
                צור {activePrompts.length} גרסאות סקר
              </Button>
            </motion.div>
          )}

          {/* ── GENERATING STAGE ── */}
          {stage === 'generating' && (
            <motion.div key="generating" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-12 h-12 text-[#E85A24] animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-[#6B2D4A] mb-2">
                יוצר {activePrompts.length} גרסאות בזו אחר זו...
              </h1>
              <p className="text-gray-500 mb-8">זה לוקח 1-2 דקות, נא לא לסגור את הדף</p>

              <div className="space-y-3 max-w-xs mx-auto text-right">
                {activePrompts.map((p, i) => {
                  const v = versions[i];
                  const isDone = v?.done && !v?.error;
                  const isError = v?.done && v?.error;
                  const isRunning = !v?.done && versions.some((vv, ii) => ii < i && vv?.done) || (i === 0 && !v?.done);
                  return (
                    <div key={i} className={`flex items-center gap-3 rounded-xl p-3 shadow-sm ${isDone ? 'bg-green-50' : isError ? 'bg-red-50' : 'bg-white'}`}>
                      {isDone
                        ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        : isError
                        ? <span className="w-5 h-5 text-red-400 flex-shrink-0 font-bold">✗</span>
                        : <Loader2 className="w-5 h-5 text-[#E85A24] animate-spin flex-shrink-0" />
                      }
                      <div>
                        <p className="font-medium text-gray-700 text-sm">גרסה {i + 1}</p>
                        <p className="text-xs text-gray-400">{p.name}</p>
                        {isError && <p className="text-xs text-red-500">{v?.errorMsg || 'שגיאה'}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── REVIEW STAGE ── */}
          {stage === 'review' && (
            <motion.div key="review" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-[#6B2D4A]">
                  {versions.filter(v => !v.error).length} גרסאות נוצרו!
                </h1>
                <p className="text-gray-500 mt-1">
                  צפה בכל גרסה, דרג אותה, ואז בחר את המועדפת לפרסום
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {versions.map((v, i) => (
                  <div
                    key={i}
                    className={`rounded-xl border-2 p-4 transition-all ${
                      chosenIndex === i
                        ? 'border-[#E85A24] bg-orange-50'
                        : v.error
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-right flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#6B2D4A]">גרסה {i + 1}</p>
                          {chosenIndex === i && (
                            <span className="bg-[#E85A24] text-white text-xs px-2 py-0.5 rounded-full font-medium">
                              נבחרה
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{v.promptName}</p>
                        {v.error && <p className="text-xs text-red-500 mt-1">שגיאה ביצירה</p>}
                      </div>
                      {!v.error && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setViewingIndex(i); setStage('view_version'); }}
                            className="text-[#6B2D4A] border-[#6B2D4A] hover:bg-purple-50"
                          >
                            <Eye className="w-4 h-4 ml-1" />
                            צפה
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleChoose(i)}
                            className={chosenIndex === i ? 'bg-[#E85A24] text-white' : 'bg-gray-100 text-gray-700 hover:bg-orange-100'}
                          >
                            <Trophy className="w-4 h-4 ml-1" />
                            {chosenIndex === i ? 'נבחרה ✓' : 'בחר'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {chosenIndex !== null && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Button
                    onClick={handlePublishChosen}
                    className="w-full py-6 bg-[#E85A24] hover:bg-[#D14A1A] text-white text-lg font-medium rounded-xl shadow-lg shadow-orange-200"
                  >
                    <FileText className="w-5 h-5 ml-2" />
                    המשך לעריכה ופרסום של גרסה {chosenIndex + 1}
                    <ChevronLeft className="w-5 h-5 mr-2" />
                  </Button>
                </motion.div>
              )}

              {chosenIndex === null && (
                <p className="text-center text-sm text-gray-400 mt-2">
                  צפה בגרסאות ובחר את המועדפת לפרסום
                </p>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}