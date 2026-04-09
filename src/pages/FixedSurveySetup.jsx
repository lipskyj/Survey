import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { motion } from 'framer-motion';
import { 
  ChevronRight, Edit2, Trash2, Plus, GripVertical,
  Save, FileText, Loader2, Globe, BookOpen, Link2
} from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Switch } from "@/components/ui/switch";

const FIXED_SURVEY_SLUG_PREFIX = 'fixed-return-';

const FIXED_SURVEY_TEMPLATE = {
  he: {
    title: 'שאלון חזרה לשגרה',
    intro: 'שלום! אנחנו שמחים שחזרת. אנא ענה/י על כמה שאלות קצרות כדי שנוכל להבין איך אתה/את מרגיש/ה.',
    questions: [
      { prompt_hebrew: 'איך אתה/את מרגיש/ה עם החזרה לשגרה?', question_type: 'scale_5', kit_domain: 'belonging', order_index: 0 },
      { prompt_hebrew: 'באיזו מידה אתה/את מוכן/ה ללמידה?', question_type: 'scale_5', kit_domain: 'relevance', order_index: 1 },
      { prompt_hebrew: 'האם קיבלת את התמיכה שהיית זקוק/ה לה?', question_type: 'scale_5', kit_domain: 'belonging', order_index: 2 },
      { prompt_hebrew: 'מה עזר לך יותר בחזרה לשגרה?', question_type: 'open_text', kit_domain: 'none', order_index: 3 },
      { prompt_hebrew: 'האם יש משהו שהיית רוצה/ת לשתף?', question_type: 'open_text', kit_domain: 'none', order_index: 4 },
    ]
  },
  ar: {
    title: 'استبيان العودة إلى الروتين',
    intro: 'مرحباً! يسعدنا عودتك. يرجى الإجابة على بعض الأسئلة القصيرة حتى نتمكن من فهم كيف تشعر.',
    questions: [
      { prompt_hebrew: 'كيف تشعر بشأن العودة إلى الروتين؟', question_type: 'scale_5', kit_domain: 'belonging', order_index: 0 },
      { prompt_hebrew: 'إلى أي مدى أنت مستعد/ة للتعلم؟', question_type: 'scale_5', kit_domain: 'relevance', order_index: 1 },
      { prompt_hebrew: 'هل حصلت على الدعم الذي كنت بحاجة إليه؟', question_type: 'scale_5', kit_domain: 'belonging', order_index: 2 },
      { prompt_hebrew: 'ما الذي ساعدك أكثر في العودة إلى الروتين؟', question_type: 'open_text', kit_domain: 'none', order_index: 3 },
      { prompt_hebrew: 'هل هناك شيء تود مشاركته؟', question_type: 'open_text', kit_domain: 'none', order_index: 4 },
    ]
  }
};

const QUESTION_TYPE_LABELS = {
  scale_5: 'סולם 1-5',
  scale_7: 'סולם 1-7',
  open_text: 'שאלה פתוחה',
  single_choice: 'בחירה יחידה',
  multi_choice: 'בחירה מרובה',
  bottom_line: 'שאלת שורה תחתונה'
};

export default function FixedSurveySetup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null); // 'he' | 'ar'
  const [surveyId, setSurveyId] = useState(null);
  const [editingIntro, setEditingIntro] = useState(false);
  const [introText, setIntroText] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  // Find if this user already has a fixed survey in this language
  const { data: existingSurveys = [], isLoading: loadingExisting } = useQuery({
    queryKey: ['fixed-surveys', currentUser?.email],
    queryFn: () => base44.entities.Survey.filter({ created_by: currentUser.email }, '-created_date'),
    enabled: !!currentUser,
  });

  const fixedSurveys = existingSurveys.filter(s => s.title?.startsWith('שאלון חזרה לשגרה') || s.title?.startsWith('استبيان العودة'));

  const currentFixedSurvey = fixedSurveys.find(s =>
    selectedLanguage === 'he' ? s.language === 'hebrew' : s.language === 'arabic'
  );

  const { data: survey, isLoading: surveyLoading } = useQuery({
    queryKey: ['survey', currentFixedSurvey?.id],
    queryFn: async () => {
      const s = await base44.entities.Survey.filter({ id: currentFixedSurvey.id });
      if (s.length > 0) { setIntroText(s[0].intro_text || ''); return s[0]; }
      return null;
    },
    enabled: !!currentFixedSurvey?.id,
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['survey-questions', currentFixedSurvey?.id],
    queryFn: () => base44.entities.SurveyQuestion.filter({ survey_id: currentFixedSurvey.id }, 'order_index'),
    enabled: !!currentFixedSurvey?.id,
  });

  const handleCreateFixedSurvey = async (lang) => {
    setIsCreating(true);
    setSelectedLanguage(lang);
    try {
      const template = FIXED_SURVEY_TEMPLATE[lang];
      const newSurvey = await base44.entities.Survey.create({
        title: template.title,
        status: 'draft',
        language: lang === 'he' ? 'hebrew' : 'arabic',
        intro_text: template.intro,
        audience: 'students',
      });

      await base44.entities.SurveyQuestion.bulkCreate(
        template.questions.map(q => ({ ...q, survey_id: newSurvey.id, is_required: true, is_generated: false }))
      );

      queryClient.invalidateQueries(['fixed-surveys', currentUser?.email]);
      setSurveyId(newSurvey.id);
      toast.success('השאלון נוצר בהצלחה!');
    } catch (e) {
      toast.error('שגיאה ביצירת השאלון');
    }
    setIsCreating(false);
  };

  const updateIntroMutation = useMutation({
    mutationFn: (text) => base44.entities.Survey.update(currentFixedSurvey.id, { intro_text: text }),
    onSuccess: () => {
      queryClient.invalidateQueries(['survey', currentFixedSurvey.id]);
      setEditingIntro(false);
      toast.success('הפתיחה נשמרה');
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId) => base44.entities.SurveyQuestion.delete(questionId),
    onSuccess: () => queryClient.invalidateQueries(['survey-questions', currentFixedSurvey?.id])
  });

  const reorderMutation = useMutation({
    mutationFn: async (newOrder) => {
      for (let i = 0; i < newOrder.length; i++) {
        await base44.entities.SurveyQuestion.update(newOrder[i].id, { order_index: i });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['survey-questions', currentFixedSurvey?.id])
  });

  const toggleRequiredMutation = useMutation({
    mutationFn: ({ questionId, isRequired }) =>
      base44.entities.SurveyQuestion.update(questionId, { is_required: isRequired }),
    onSuccess: () => queryClient.invalidateQueries(['survey-questions', currentFixedSurvey?.id])
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(questions);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    queryClient.setQueryData(['survey-questions', currentFixedSurvey?.id], items);
    reorderMutation.mutate(items);
  };

  const activeSurvey = survey || currentFixedSurvey;
  const activeId = currentFixedSurvey?.id;

  // Language selection screen
  if (!selectedLanguage && !loadingExisting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
        <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
              <ChevronRight className="w-5 h-5" />
              חזרה
            </Link>
            <h1 className="font-bold text-lg text-[#6B2D4A]">שאלון חזרה לשגרה</h1>
            <div className="w-20" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#6B2D4A] mb-2">שאלון חזרה לשגרה</h2>
          <p className="text-gray-500 mb-8">שאלון קבוע שתוכל/י לשתף עם כיתות ולקבל תוצאות נפרדות לכל כיתה</p>

          <div className="grid gap-4 max-w-md mx-auto">
            {/* Hebrew */}
            {fixedSurveys.find(s => s.language === 'hebrew') ? (
              <Button
                onClick={() => setSelectedLanguage('he')}
                className="py-8 text-lg bg-[#E85A24] hover:bg-[#D14A1A] rounded-2xl"
              >
                <Globe className="w-6 h-6 ml-3" />
                עברית — ערוך את השאלון
              </Button>
            ) : (
              <Button
                onClick={() => handleCreateFixedSurvey('he')}
                disabled={isCreating}
                className="py-8 text-lg bg-[#E85A24] hover:bg-[#D14A1A] rounded-2xl"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Globe className="w-6 h-6 ml-3" />צור שאלון בעברית</>}
              </Button>
            )}

            {/* Arabic */}
            {fixedSurveys.find(s => s.language === 'arabic') ? (
              <Button
                onClick={() => setSelectedLanguage('ar')}
                variant="outline"
                className="py-8 text-lg border-2 border-[#6B2D4A] text-[#6B2D4A] rounded-2xl"
              >
                <Globe className="w-6 h-6 ml-3" />
                عربي — ערוך את השאלון
              </Button>
            ) : (
              <Button
                onClick={() => handleCreateFixedSurvey('ar')}
                disabled={isCreating}
                variant="outline"
                className="py-8 text-lg border-2 border-[#6B2D4A] text-[#6B2D4A] rounded-2xl"
              >
                {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Globe className="w-6 h-6 ml-3" />צור שאלון בערבית</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loadingExisting || surveyLoading || questionsLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#E85A24] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => setSelectedLanguage(null)} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
            <ChevronRight className="w-5 h-5" />
            חזרה
          </button>
          <h1 className="font-bold text-lg text-[#6B2D4A]">
            {selectedLanguage === 'he' ? 'שאלון חזרה לשגרה — עברית' : 'شالون חזرה לשגרה — عربي'}
          </h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Class Link Button */}
        <Card className="bg-gradient-to-l from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">יצירת קישור לכיתה</p>
              <p className="text-sm text-blue-600">כל כיתה מקבלת קישור נפרד עם תוצאות נפרדות</p>
            </div>
            <Link to={createPageUrl('FixedSurveyClassLink') + `?surveyId=${activeId}`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Link2 className="w-4 h-4" />
                צור קישור
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Intro Section */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#6B2D4A]">פתיחת השאלון</h2>
              <Button variant="ghost" size="sm" onClick={() => setEditingIntro(!editingIntro)}>
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
            {editingIntro ? (
              <div className="space-y-3">
                <Textarea
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  className="min-h-[100px] resize-none"
                  dir={selectedLanguage === 'ar' ? 'rtl' : 'rtl'}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditingIntro(false)}>ביטול</Button>
                  <Button onClick={() => updateIntroMutation.mutate(introText)} className="bg-[#E85A24] hover:bg-[#D14A1A]">
                    <Save className="w-4 h-4 ml-1" />שמור
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 whitespace-pre-wrap">{activeSurvey?.intro_text || 'לא הוגדרה פתיחה'}</p>
            )}
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[#6B2D4A]">שאלות ({questions.length})</h2>
          <Link to={createPageUrl('AddQuestion') + `?surveyId=${activeId}&returnTo=FixedSurveySetup&lang=${selectedLanguage}`}>
            <Button variant="outline" size="sm" className="text-[#E85A24] border-[#E85A24]">
              <Plus className="w-4 h-4 ml-1" />הוסף שאלה
            </Button>
          </Link>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                {questions.map((question, index) => (
                  <Draggable key={question.id} draggableId={question.id} index={index}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} className={snapshot.isDragging ? 'opacity-80' : ''}>
                        <Card className="bg-white border-0 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div {...provided.dragHandleProps} className="mt-1 cursor-grab text-gray-400 hover:text-gray-600">
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="bg-orange-100 text-[#E85A24] text-xs px-2 py-1 rounded-full">{index + 1}</span>
                                  <span className="text-xs text-gray-500">{QUESTION_TYPE_LABELS[question.question_type]}</span>
                                </div>
                                <p className="text-gray-800 font-medium">{question.prompt_hebrew}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Switch
                                    checked={question.is_required !== false}
                                    onCheckedChange={(checked) => toggleRequiredMutation.mutate({ questionId: question.id, isRequired: checked })}
                                    className="scale-75"
                                  />
                                  <span className="text-xs text-gray-500">{question.is_required !== false ? 'חובה' : 'אופציונלי'}</span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Link to={createPageUrl('EditQuestion') + `?surveyId=${activeId}&questionId=${question.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 className="w-4 h-4 text-gray-400" /></Button>
                                </Link>
                                <Button
                                  variant="ghost" size="icon" className="h-8 w-8"
                                  onClick={() => { if (confirm('האם למחוק את השאלה?')) deleteQuestionMutation.mutate(question.id); }}
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {questions.length === 0 && (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">אין שאלות בשאלון</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}