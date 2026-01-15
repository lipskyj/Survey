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
      const params = new URLSearchParams(window.location.search);
      const id = params.get('surveyId');
      if (id) {
        setSurveyId(id);
        const surveys = await base44.entities.Survey.filter({ id });
        if (surveys.length > 0) {
          setSurvey(surveys[0]);
        }
      }
      
      // Load active prompts
      const prompts = await base44.entities.AdminPrompt.filter({ is_active: true });
      setActivePrompts(prompts);
    };
    loadData();
  }, []);

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

  const generateWithPrompt = async (prompt) => {
    // Generate questions using LLM
    const scaleResponse = await base44.integrations.Core.InvokeLLM({
      prompt: buildPromptFromTemplate(prompt.prompt_text, survey),
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

    // Create a duplicate survey
    const newSurvey = await base44.entities.Survey.create({
      ...survey,
      title: `${survey.activity_description?.slice(0, 30) || 'סקר'} - ${prompt.name}`,
      prompt_version: prompt.name,
      status: 'draft'
    });

    // Create questions
    let orderIndex = 0;
    const questionsToCreate = [];
    const bgQuestions = survey.background_questions || {};

    if (survey.is_anonymous === false) {
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
      const selectedGradeRanges = survey.grade_range?.selected_grades || [];
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
        prompt_hebrew: survey.audience === 'parents' ? 'באיזו כיתה ילדך/ילדתך?' : 'באיזו כיתה את/ה?',
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
        scale_labels: { low: 'לא מסכים כלל', high: 'מסכים לחלוטין' },
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
      prompt_hebrew: bottomLinePrompts[survey.audience] || bottomLinePrompts.students,
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

  const generateAll = async () => {
    if (activePrompts.length === 0) {
      toast.error('אין פרומפטים פעילים');
      return;
    }

    setIsGenerating(true);
    const results = [];

    try {
      for (let i = 0; i < activePrompts.length; i++) {
        setCurrentPromptIndex(i);
        const newSurvey = await generateWithPrompt(activePrompts[i]);
        results.push({ prompt: activePrompts[i].name, survey: newSurvey });
      }

      setGeneratedSurveys(results);
      setSelectedVersions(results.map((_, idx) => idx)); // Select all by default
      setIsComplete(true);
      toast.success(`נוצרו ${results.length} גרסאות סקר!`);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('שגיאה ביצירת הסקרים');
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
                <div>
                  <CardTitle className="text-2xl">{viewingVersion.survey.title}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    נוצר בעזרת: <span className="font-medium text-[#E85A24]">{viewingVersion.prompt}</span>
                  </p>
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
              className="text-center mb-8"
            >
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-[#E85A24]" />
              </div>
              <h1 className="text-3xl font-bold text-[#6B2D4A] mb-2">
                יצירת גרסאות סקר מרובות
              </h1>
              <p className="text-gray-500 mb-4">
                {activePrompts.length} פרומפטים פעילים - ייווצרו {activePrompts.length} גרסאות סקר
              </p>

              <div className="grid gap-3 mb-6 max-w-xl mx-auto">
                {activePrompts.map((prompt, idx) => (
                  <Card key={prompt.id} className="border-[#E85A24]">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#E85A24] text-white flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-medium text-[#6B2D4A]">{prompt.name}</p>
                        <p className="text-xs text-gray-500">{prompt.language === 'both' ? 'עברית + عربية' : prompt.language}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                onClick={generateAll}
                disabled={activePrompts.length === 0}
                className="px-8 py-6 bg-[#E85A24] hover:bg-[#D14A1A] text-white text-lg font-medium rounded-xl"
              >
                <Sparkles className="w-5 h-5 ml-2" />
                צור את כל הגרסאות
              </Button>
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

              <div className="grid gap-4 mb-6">
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
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex gap-2">
                        <Button
                          onClick={() => viewVersion({ prompt, survey })}
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