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
  Save, FileText, Loader2, Globe, BookOpen, Link2, BarChart2
} from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Switch } from "@/components/ui/switch";

const FIXED_SURVEY_SLUG_PREFIX = 'fixed-return-';

const FIXED_SURVEY_TEMPLATE = {
  he: {
    title: 'שאלון "מה נשמע?" – חזרה ממלחמת שאגת הארי',
    intro: `תלמידים ותלמידות יקרים,

אנחנו חוזרים לבית הספר אחרי תקופה לא פשוטה, וחשוב לנו להבין איך אתם מרגישים ומה יכול לעזור לכם לחזור ללמידה בצורה טובה.
השאלון קצר והמטרה שלו היא לעזור לנו להתאים את הלמידה וההתנהלות בבית הספר למה שאתם באמת צריכים בתקופה הזו.
נשמח שתענו בכנות — זה יעזור לנו לעזור לכם.

תודה, צוות ביה"ס`,
    questions: [
      {
        prompt_hebrew: 'אני שמח/ה לחזור לבית הספר בתקופה הזו.',
        question_type: 'scale_5',
        kit_domain: 'belonging',
        order_index: 0,
        scale_labels: { low: 'בכלל לא', high: 'במידה רבה מאד' }
      },
      {
        prompt_hebrew: 'חשוב לי לסיים את השנה הזו בצורה טובה.',
        question_type: 'scale_5',
        kit_domain: 'relevance',
        order_index: 1,
        scale_labels: { low: 'בכלל לא', high: 'במידה רבה מאד' }
      },
      {
        prompt_hebrew: 'אני מאמין/ה שאני מסוגל/ת להצליח בלמידה בחודשים שנשארו.',
        question_type: 'scale_5',
        kit_domain: 'skills',
        order_index: 2,
        scale_labels: { low: 'בכלל לא', high: 'במידה רבה מאד' }
      },
      {
        prompt_hebrew: 'אני מבין/ה מה מצופה ממני לימודית בתקופה הקרובה.',
        question_type: 'scale_5',
        kit_domain: 'relevance',
        order_index: 3,
        scale_labels: { low: 'בכלל לא', high: 'במידה רבה מאד' }
      },
      {
        prompt_hebrew: 'יש בבית הספר מבוגר שאני יכול/ה לפנות אליו כשקשה לי.',
        question_type: 'scale_5',
        kit_domain: 'belonging',
        order_index: 4,
        scale_labels: { low: 'בכלל לא', high: 'במידה רבה מאד' }
      },
      {
        prompt_hebrew: 'אני מרגיש/ה שאני עדיין לחוץ/ה, עצבני/ת או מוצף/ת.',
        question_type: 'scale_5',
        kit_domain: 'belonging',
        order_index: 5,
        scale_labels: { low: 'בכלל לא', high: 'במידה רבה מאד' }
      },
      {
        prompt_hebrew: 'חזרה לשגרת למידה אחרי מלחמה ממושכת היא מאתגרת. אילו אתגרים את/ה מזהה אצלך בתקופה זו? ציין/ני את 3 האתגרים המרכזיים עבורך.',
        question_type: 'multi_choice',
        kit_domain: 'none',
        order_index: 6,
        choices: [
          { value: 'concentration', label: 'קושי להתרכז' },
          { value: 'fatigue', label: 'עייפות / חוסר אנרגיה' },
          { value: 'stress', label: 'לחץ או מתח רגשי' },
          { value: 'academic_gap', label: 'פער לימודי שנוצר' },
          { value: 'overload', label: 'עומס משימות' },
          { value: 'routine', label: 'קושי לחזור לשגרה' },
          { value: 'time_management', label: 'קושי בניהול זמן' },
          { value: 'home', label: 'עניינים בבית / במשפחה' },
          { value: 'social', label: 'קושי חברתי' },
          { value: 'motivation', label: 'חוסר מוטיבציה' },
          { value: 'other', label: 'משהו אחר' }
        ]
      },
      {
        prompt_hebrew: 'מה הכי יעזור לך ללמוד טוב יותר עד סוף השנה? אפשר לבחור עד 3.',
        question_type: 'multi_choice',
        kit_domain: 'none',
        order_index: 7,
        choices: [
          { value: 'clear_schedule', label: 'סדר ברור וידוע מראש' },
          { value: 'less_load', label: 'הפחתת עומס' },
          { value: 'catch_up', label: 'עזרה בהשלמת חומר' },
          { value: 'personal_consideration', label: 'יותר התחשבות במצב האישי' },
          { value: 'group_learning', label: 'למידה בקבוצות' },
          { value: 'fun_time', label: 'זמן כיף עם חברים' },
          { value: 'short_tasks', label: 'משימות קצרות וברורות' },
          { value: 'encouragement', label: 'חיזוק ועידוד מהמורים' },
          { value: 'class_time', label: 'יותר זמן לעבודה בכיתה' },
          { value: 'personal_talk', label: 'שיחות אישיות עם מחנכ/ת או מורה' },
          { value: 'relaxation', label: 'טכניקות להירגע' },
          { value: 'other', label: 'משהו אחר' }
        ]
      },
      {
        prompt_hebrew: 'מה הכי חשוב שהמחנכ/ת או הצוות ידעו עליך עכשיו כדי לעזור לך להצליח?',
        question_type: 'open_text',
        kit_domain: 'none',
        order_index: 8
      },
      {
        prompt_hebrew: 'מה לדעתך בית הספר צריך לעשות בחודשיים הקרובים כדי לעזור לתלמידים?',
        question_type: 'open_text',
        kit_domain: 'none',
        order_index: 9
      },
    ]
  },
  ar: {
    title: 'استبيان "كيف حالك؟" – العودة بعد الحرب',
    intro: `الطلاب والطالبات الأعزاء،

نعود إلى المدرسة بعد فترة صعبة، ومن المهم لنا أن نفهم كيف تشعرون وما الذي يمكن أن يساعدكم على العودة إلى التعلم بشكل جيد.
الاستبيان قصير وهدفه مساعدتنا في تكييف التعليم والسير اليومي في المدرسة وفق ما تحتاجونه فعلاً في هذه الفترة.
يسعدنا أن تجيبوا بصدق — هذا سيساعدنا في مساعدتكم.

شكراً، طاقم المدرسة`,
    questions: [
      {
        prompt_hebrew: 'من المهم لي إنهاء هذه السنة بشكل جيد.',
        question_type: 'scale_5',
        kit_domain: 'relevance',
        order_index: 0,
        scale_labels: { low: 'لا أبداً', high: 'بدرجة كبيرة جداً' }
      },
      {
        prompt_hebrew: 'أؤمن بأنني قادر/ة على النجاح في التعلم في الأشهر المتبقية.',
        question_type: 'scale_5',
        kit_domain: 'skills',
        order_index: 1,
        scale_labels: { low: 'لا أبداً', high: 'بدرجة كبيرة جداً' }
      },
      {
        prompt_hebrew: 'أفهم ما هو متوقع مني دراسياً في الفترة القادمة.',
        question_type: 'scale_5',
        kit_domain: 'relevance',
        order_index: 2,
        scale_labels: { low: 'لا أبداً', high: 'بدرجة كبيرة جداً' }
      },
      {
        prompt_hebrew: 'يوجد في المدرسة بالغ يمكنني التوجه إليه عندما أجد صعوبة.',
        question_type: 'scale_5',
        kit_domain: 'belonging',
        order_index: 3,
        scale_labels: { low: 'لا أبداً', high: 'بدرجة كبيرة جداً' }
      },
      {
        prompt_hebrew: 'أشعر أنني لا أزال متوتر/ة، عصبي/ة أو مرهق/ة.',
        question_type: 'scale_5',
        kit_domain: 'belonging',
        order_index: 4,
        scale_labels: { low: 'لا أبداً', high: 'بدرجة كبيرة جداً' }
      },
      {
        prompt_hebrew: 'العودة إلى روتين التعلم بعد حرب طويلة أمر صعب. ما هي التحديات التي تواجهها في هذه الفترة؟ اختر/ي 3 تحديات رئيسية.',
        question_type: 'multi_choice',
        kit_domain: 'none',
        order_index: 5,
        choices: [
          { value: 'concentration', label: 'صعوبة في التركيز' },
          { value: 'fatigue', label: 'التعب / نقص الطاقة' },
          { value: 'stress', label: 'ضغط أو توتر عاطفي' },
          { value: 'academic_gap', label: 'فجوة دراسية تكونت' },
          { value: 'overload', label: 'ضغط المهام' },
          { value: 'routine', label: 'صعوبة العودة إلى الروتين' },
          { value: 'time_management', label: 'صعوبة في إدارة الوقت' },
          { value: 'home', label: 'أمور في البيت / الأسرة' },
          { value: 'social', label: 'صعوبة اجتماعية' },
          { value: 'motivation', label: 'نقص في الدافعية' },
          { value: 'other', label: 'شيء آخر' }
        ]
      },
      {
        prompt_hebrew: 'ما الذي سيساعدك أكثر على التعلم حتى نهاية السنة؟ يمكنك اختيار حتى 3.',
        question_type: 'multi_choice',
        kit_domain: 'none',
        order_index: 6,
        choices: [
          { value: 'clear_schedule', label: 'جدول واضح ومعروف مسبقاً' },
          { value: 'less_load', label: 'تخفيف الضغط' },
          { value: 'catch_up', label: 'مساعدة في استكمال المادة' },
          { value: 'personal_consideration', label: 'مراعاة أكثر للوضع الشخصي' },
          { value: 'group_learning', label: 'التعلم في مجموعات' },
          { value: 'fun_time', label: 'وقت ممتع مع الأصدقاء' },
          { value: 'short_tasks', label: 'مهام قصيرة وواضحة' },
          { value: 'encouragement', label: 'تعزيز وتشجيع من المعلمين' },
          { value: 'class_time', label: 'وقت أكثر للعمل في الصف' },
          { value: 'personal_talk', label: 'محادثات شخصية مع المعلم/ة أو المربي/ة' },
          { value: 'relaxation', label: 'تقنيات للاسترخاء' },
          { value: 'other', label: 'شيء آخر' }
        ]
      },
      {
        prompt_hebrew: 'ما الأهم الذي يجب أن يعرفه المعلم/ة أو الطاقم عنك الآن لمساعدتك على النجاح؟',
        question_type: 'open_text',
        kit_domain: 'none',
        order_index: 7
      },
      {
        prompt_hebrew: 'برأيك، ماذا يجب أن تفعل المدرسة في الشهرين القادمين لمساعدة الطلاب؟',
        question_type: 'open_text',
        kit_domain: 'none',
        order_index: 8
      },
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

  const fixedSurveys = existingSurveys.filter(s =>
    s.title?.startsWith('שאלון "מה נשמע?"') ||
    s.title?.startsWith('شالון حزרה') ||
    s.title?.startsWith('استبيان "كيف') ||
    s.title?.startsWith('שאלון חזרה לשגרה') ||
    s.title?.startsWith('استبيان العودة')
  );

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

  const [isResetting, setIsResetting] = useState(false);

  const handleResetSurvey = async () => {
    if (!confirm('האם לאפס את השאלון ולבנות אותו מחדש לפי התבנית העדכנית? פעולה זו תמחק את כל השאלות הקיימות.')) return;
    setIsResetting(true);
    try {
      const template = FIXED_SURVEY_TEMPLATE[selectedLanguage];
      // Delete all existing questions
      for (const q of questions) {
        await base44.entities.SurveyQuestion.delete(q.id);
      }
      // Update survey intro & title
      await base44.entities.Survey.update(currentFixedSurvey.id, {
        title: template.title,
        intro_text: template.intro,
      });
      // Recreate questions from template
      await base44.entities.SurveyQuestion.bulkCreate(
        template.questions.map(q => ({ ...q, survey_id: currentFixedSurvey.id, is_required: true, is_generated: false }))
      );
      queryClient.invalidateQueries(['survey-questions', currentFixedSurvey.id]);
      queryClient.invalidateQueries(['survey', currentFixedSurvey.id]);
      queryClient.invalidateQueries(['fixed-surveys', currentUser?.email]);
      setIntroText(template.intro);
      toast.success('השאלון אופס ונבנה מחדש!');
    } catch (e) {
      toast.error('שגיאה באיפוס השאלון');
    }
    setIsResetting(false);
  };

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
        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl('FixedSurveyClassLink') + `?surveyId=${activeId}`} className="block">
            <Card className="bg-gradient-to-l from-blue-50 to-indigo-50 border-blue-200 h-full cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <Link2 className="w-6 h-6 text-blue-600" />
                <p className="font-semibold text-blue-900 text-sm">קישורי כיתה</p>
                <p className="text-xs text-blue-600">צור קישור לכל כיתה</p>
              </CardContent>
            </Card>
          </Link>
          <Link to={currentUser?.role === 'admin' ? createPageUrl('FixedSurveyAnalytics') : createPageUrl('PersonalDashboard')} className="block">
            <Card className="bg-gradient-to-l from-purple-50 to-pink-50 border-purple-200 h-full cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <BarChart2 className="w-6 h-6 text-purple-600" />
                <p className="font-semibold text-purple-900 text-sm">לוח בקרה</p>
                <p className="text-xs text-purple-600">ניתוח תוצאות הכיתות שלי</p>
              </CardContent>
            </Card>
          </Link>
        </div>

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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold text-[#6B2D4A]">שאלות ({questions.length})</h2>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              className="text-red-500 border-red-300 hover:bg-red-50"
              onClick={handleResetSurvey}
              disabled={isResetting}
            >
              {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : '↺ אפס לתבנית'}
            </Button>
            <Link to={createPageUrl('AddQuestion') + `?surveyId=${activeId}&returnTo=FixedSurveySetup&lang=${selectedLanguage}`}>
              <Button variant="outline" size="sm" className="text-[#E85A24] border-[#E85A24]">
                <Plus className="w-4 h-4 ml-1" />הוסף שאלה
              </Button>
            </Link>
          </div>
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