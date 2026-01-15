import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion } from 'framer-motion';
import { Lock, Sparkles, Save, RotateCcw, Copy, CheckCircle, Settings, Eye, EyeOff, Plus, Trash2, Edit2, Home } from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_PASSWORD = '1234';

// Default prompts storage key
const PROMPTS_STORAGE_KEY = 'admin_prompts_config';

const DEFAULT_SCALE_PROMPT_HE = `אתה מומחה להערכה בית ספרית מבוסס על "ערכה להערכת תכניות ופעילויות בית ספריות" של רשת עתיד.

🎯 מטרת השאלון: לסייע לצוותים לקיים הערכה פשוטה, עניינית ומשמעותית שתשמש תשתית לקבלת החלטות מבוססות נתונים.

═══════════════════════════════════════
📋 פרטי הפעילות/תוכנית:
═══════════════════════════════════════
• תיאור: {activity_description}
• קהל יעד: {audience}
• שכבות גיל: {grades}
• סוג: {event_type}
• תחומי מיקוד: {content_focus}
{values_section}
{knowledge_section}
{skills_section}
{goals_section}
{success_section}

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

{student_language_section}

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

═══════════════════════════════════════
📤 פורמט התשובה:
═══════════════════════════════════════
החזר JSON עם מערך של 10 שאלות בדיוק.
כל שאלה כוללת:
- prompt: טקסט ההיגד בעברית
- kit_domain: אחד מ: relevance, skills, delivery_quality, belonging

דוגמה לפורמט:
{
  "questions": [
    {"prompt": "למדתי דברים חדשים שלא ידעתי קודם", "kit_domain": "skills"},
    {"prompt": "המנחה העביר את הפעילות בצורה מעניינת", "kit_domain": "delivery_quality"}
  ]
}`;

const DEFAULT_SCALE_PROMPT_AR = `أنت خبير في التقييم المدرسي بناءً على "مجموعة أدوات تقييم البرامج والأنشطة المدرسية" لشبكة عتيد.

🎯 هدف الاستبيان: مساعدة الفرق على إجراء تقييم بسيط وموضوعي وهادف يشكل أساساً لاتخاذ قرارات مبنية على البيانات.

═══════════════════════════════════════
📋 تفاصيل النشاط/البرنامج:
═══════════════════════════════════════
• الوصف: {activity_description}
• الجمهور المستهدف: {audience}
• الصفوف: {grades}
• النوع: {event_type}
• مجالات التركيز: {content_focus}
{values_section}
{knowledge_section}
{skills_section}
{goals_section}
{success_section}

═══════════════════════════════════════
🔬 نموذج التقييم متعدد الطبقات (KIT Framework):
═══════════════════════════════════════
يجب أن يغطي كل استبيان جميع الطبقات التالية:

🅰️ الطبقة المعرفية - اكتساب المعرفة
🅱️ طبقة المهارات والتطبيق
🅲️ الطبقة العاطفية-التحفيزية
🅳️ طبقة الانتماء والمشاركة
🅴️ طبقة الصلة بالواقع
🅵️ جودة التوجيه/الإرشاد

═══════════════════════════════════════
⚠️ تعليمات إلزامية:
═══════════════════════════════════════
1. ✅ كل عبارة تقيس بُعداً واحداً فقط
2. ✅ لا تكرار - كل عبارة مختلفة جوهرياً
3. ✅ صياغة إيجابية
4. ✅ قصيرة وواضحة - حتى 15 كلمة
5. ✅ تصنيف: 5 درجات (1=لا أوافق إطلاقاً، 5=أوافق تماماً)

{student_language_section}

═══════════════════════════════════════
📊 هيكل الاستبيان المطلوب:
═══════════════════════════════════════
أنشئ بالضبط 10 عبارات للتصنيف.

═══════════════════════════════════════
📤 صيغة الإجابة:
═══════════════════════════════════════
أعد JSON مع مصفوفة من 10 أسئلة بالضبط.
كل سؤال يتضمن:
- prompt: نص العبارة بالعربية
- kit_domain: أحد: relevance, skills, delivery_quality, belonging

{
  "questions": [
    {"prompt": "تعلمت أشياء جديدة لم أكن أعرفها من قبل", "kit_domain": "skills"},
    {"prompt": "قدّم المرشد النشاط بطريقة مثيرة للاهتمام", "kit_domain": "delivery_quality"}
  ]
}`;

const DEFAULT_OPEN_PROMPT_HE = `אתה מומחה להערכה בית ספרית. צור שאלות פתוחות לסקר משוב.

═══════════════════════════════════════
📋 פרטי הפעילות:
═══════════════════════════════════════
• תיאור: {activity_description}
• סוג: {event_type}
• קהל: {audience}

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
{audience_language}
{ongoing_note}
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

const DEFAULT_OPEN_PROMPT_AR = `أنت خبير في التقييم المدرسي. أنشئ أسئلة مفتوحة لاستبيان التغذية الراجعة.

═══════════════════════════════════════
📋 تفاصيل النشاط:
═══════════════════════════════════════
• الوصف: {activity_description}
• النوع: {event_type}
• الجمهور: {audience}

═══════════════════════════════════════
📊 أنشئ بالضبط 4 أسئلة مفتوحة:
═══════════════════════════════════════

1️⃣ سؤال تأملي عن التعلم الذاتي
2️⃣ سؤال عن الجزء الأكثر أهمية/نجاحاً
3️⃣ سؤال نقدي للتحسين
4️⃣ سؤال مفتوح عام

═══════════════════════════════════════
⚠️ تعليمات إلزامية:
═══════════════════════════════════════
{audience_language}
{ongoing_note}
• أسئلة قصيرة وواضحة
• لا تكرار لنفس الأفكار من أسئلة التصنيف

═══════════════════════════════════════
📤 صيغة الإجابة:
═══════════════════════════════════════
{
  "questions": [
    {"prompt": "نص السؤال الأول"},
    {"prompt": "نص السؤال الثاني"},
    {"prompt": "نص السؤال الثالث"},
    {"prompt": "نص السؤال الرابع"}
  ]
}`;

export default function AdminPrompts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editName, setEditName] = useState('');
  const [editText, setEditText] = useState('');
  const [editLanguage, setEditLanguage] = useState('both');
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [newPromptLanguage, setNewPromptLanguage] = useState('both');
  const [showNewForm, setShowNewForm] = useState(false);

  const { data: prompts = [], isLoading: promptsLoading } = useQuery({
    queryKey: ['admin-prompts'],
    queryFn: () => base44.entities.AdminPrompt.list('-created_date'),
    enabled: isAuthenticated
  });

  const createPromptMutation = useMutation({
    mutationFn: (data) => base44.entities.AdminPrompt.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
      setShowNewForm(false);
      setNewPromptName('');
      setNewPromptText('');
      setNewPromptLanguage('both');
      toast.success('הפרומפט נשמר');
    },
    onError: (error) => {
      console.error('Create prompt error:', error);
      toast.error('שגיאה בשמירת הפרומפט');
    }
  });

  const updatePromptMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AdminPrompt.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
      setEditingPrompt(null);
      setEditName('');
      setEditText('');
      setEditLanguage('both');
      toast.success('הפרומפט עודכן');
    }
  });

  const startEditing = (prompt) => {
    setEditingPrompt(prompt.id);
    setEditName(prompt.name);
    setEditText(prompt.prompt_text);
    setEditLanguage(prompt.language || 'both');
  };

  const handleUpdatePrompt = () => {
    if (!editName.trim() || !editText.trim()) {
      toast.error('יש למלא שם ותוכן');
      return;
    }
    updatePromptMutation.mutate({
      id: editingPrompt,
      data: {
        name: editName,
        prompt_text: editText,
        language: editLanguage
      }
    });
  };

  const deletePromptMutation = useMutation({
    mutationFn: (id) => base44.entities.AdminPrompt.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
      toast.success('הפרומפט נמחק');
    }
  });

  const togglePromptMutation = useMutation({
    mutationFn: ({ promptId, isActive }) => {
      return base44.entities.AdminPrompt.update(promptId, { is_active: isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
      toast.success('הפרומפט עודכן');
    }
  });

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success('התחברת בהצלחה');
    } else {
      toast.error('סיסמה שגויה');
    }
  };

  const handleCreatePrompt = () => {
    if (!newPromptName.trim() || !newPromptText.trim()) {
      toast.error('יש למלא שם ותוכן לפרומפט');
      return;
    }
    createPromptMutation.mutate({
      name: newPromptName,
      prompt_text: newPromptText,
      language: newPromptLanguage,
      is_active: false
    });
  };

  const activePrompts = prompts.filter(p => p.is_active);
  const activePrompt = activePrompts.length > 0 ? activePrompts[0] : null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('הועתק ללוח');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full"
        >
          <Card className="border-2 border-gray-200">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-[#6B2D4A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#6B2D4A]" />
              </div>
              <CardTitle className="text-xl text-[#6B2D4A]">אזור ניהול פרומפטים</CardTitle>
              <p className="text-sm text-gray-500 mt-2">הזן סיסמת מנהל להמשך</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="סיסמה"
                  className="pr-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                onClick={handleLogin}
                className="w-full bg-[#6B2D4A] hover:bg-[#5A2540] text-white"
              >
                כניסה
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#6B2D4A]/10 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-[#6B2D4A]" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-[#6B2D4A]">ניהול פרומפטים</h1>
              <p className="text-xs text-gray-500">
                {activePrompts.length > 0 ? `${activePrompts.length} פרומפטים פעילים` : 'משתמש בברירת מחדל'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl('Home')}>
              <Button variant="outline" size="icon">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              onClick={() => setShowNewForm(true)}
              className="bg-[#E85A24] hover:bg-[#D14A1A] text-white"
            >
              <Plus className="w-4 h-4 ml-2" />
              פרומפט חדש
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Active Status */}
        <Card className={`border-2 ${activePrompts.length > 0 ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className={`w-5 h-5 ${activePrompts.length > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <p className="font-medium text-gray-800">סטטוס נוכחי</p>
                  <p className="text-sm text-gray-600">
                    {activePrompts.length > 0 
                      ? `${activePrompts.length} פרומפטים פעילים: ${activePrompts.map(p => p.name).join(', ')}`
                      : 'משתמש בפרומפטים הסטנדרטיים'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>משתנים זמינים בפרומפט:</strong><br />
              <code className="bg-blue-100 px-1 rounded">{'{activity_description}'}</code>, 
              <code className="bg-blue-100 px-1 rounded">{'{audience}'}</code>, 
              <code className="bg-blue-100 px-1 rounded">{'{grades}'}</code>, 
              <code className="bg-blue-100 px-1 rounded">{'{event_type}'}</code>, 
              <code className="bg-blue-100 px-1 rounded">{'{content_focus}'}</code>, 
              <code className="bg-blue-100 px-1 rounded">{'{values_section}'}</code>, 
              <code className="bg-blue-100 px-1 rounded">{'{knowledge_section}'}</code>, 
              <code className="bg-blue-100 px-1 rounded">{'{skills_section}'}</code>, 
              <code className="bg-blue-100 px-1 rounded">{'{goals_section}'}</code>, 
              <code className="bg-blue-100 px-1 rounded">{'{success_section}'}</code>
            </p>
          </CardContent>
        </Card>

        {/* New Prompt Form */}
        {showNewForm && (
          <Card className="border-2 border-[#E85A24]">
            <CardHeader>
              <CardTitle className="text-lg text-[#6B2D4A]">פרומפט חדש</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>שם הפרומפט</Label>
                <Input
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  placeholder="למשל: פרומפט מקוצר v2"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>שפה</Label>
                <div className="flex gap-2 mt-1">
                  {['both', 'hebrew', 'arabic'].map(lang => (
                    <Button
                      key={lang}
                      variant={newPromptLanguage === lang ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewPromptLanguage(lang)}
                      className={newPromptLanguage === lang ? 'bg-[#E85A24]' : ''}
                    >
                      {lang === 'both' ? 'שתיהן' : lang === 'hebrew' ? 'עברית' : 'عربية'}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>תוכן הפרומפט</Label>
                <Textarea
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  placeholder="כתוב כאן את הפרומפט המלא..."
                  className="mt-1 min-h-[300px] text-sm font-mono"
                  dir="rtl"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowNewForm(false)}>ביטול</Button>
                <Button 
                  onClick={handleCreatePrompt}
                  className="bg-[#E85A24] hover:bg-[#D14A1A]"
                  disabled={createPromptMutation.isPending}
                >
                  <Save className="w-4 h-4 ml-1" />
                  שמור
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Default Prompts Section */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg text-[#6B2D4A]">פרומפטים סטנדרטיים (ברירת מחדל)</h2>
          <Card className="border-2 border-gray-200 bg-gray-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">פרומפט דירוג - עברית</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(DEFAULT_SCALE_PROMPT_HE)}>
                  <Copy className="w-4 h-4 ml-1" /> העתק
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed max-h-32 overflow-y-auto bg-white p-3 rounded-lg border">
                {DEFAULT_SCALE_PROMPT_HE.slice(0, 400)}...
              </pre>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-gray-200 bg-gray-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">פרומפט דירוג - ערבית</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(DEFAULT_SCALE_PROMPT_AR)}>
                  <Copy className="w-4 h-4 ml-1" /> העתק
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed max-h-32 overflow-y-auto bg-white p-3 rounded-lg border" dir="rtl">
                {DEFAULT_SCALE_PROMPT_AR.slice(0, 400)}...
              </pre>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 bg-gray-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">פרומפט שאלות פתוחות - עברית</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(DEFAULT_OPEN_PROMPT_HE)}>
                  <Copy className="w-4 h-4 ml-1" /> העתק
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed max-h-32 overflow-y-auto bg-white p-3 rounded-lg border">
                {DEFAULT_OPEN_PROMPT_HE.slice(0, 400)}...
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Saved Prompts List */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg text-[#6B2D4A]">פרומפטים מותאמים ({prompts.length})</h2>
          
          {prompts.length === 0 && !promptsLoading && (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-8 text-center">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">אין פרומפטים מותאמים</p>
                <p className="text-sm text-gray-400">כשאין פרומפט פעיל, המערכת משתמשת בפרומפטים הסטנדרטיים למעלה</p>
              </CardContent>
            </Card>
          )}

          {prompts.map((prompt) => (
            <Card 
              key={prompt.id} 
              className={`border-2 ${prompt.is_active ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}
            >
              {editingPrompt === prompt.id ? (
                // Edit Mode
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label>שם הפרומפט</Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>שפה</Label>
                    <div className="flex gap-2 mt-1">
                      {['both', 'hebrew', 'arabic'].map(lang => (
                        <Button
                          key={lang}
                          variant={editLanguage === lang ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setEditLanguage(lang)}
                          className={editLanguage === lang ? 'bg-[#E85A24]' : ''}
                        >
                          {lang === 'both' ? 'שתיהן' : lang === 'hebrew' ? 'עברית' : 'عربية'}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>תוכן הפרומפט</Label>
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="mt-1 min-h-[200px] text-sm font-mono"
                      dir="rtl"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setEditingPrompt(null)}>ביטול</Button>
                    <Button 
                      onClick={handleUpdatePrompt}
                      className="bg-[#E85A24] hover:bg-[#D14A1A]"
                      disabled={updatePromptMutation.isPending}
                    >
                      <Save className="w-4 h-4 ml-1" />
                      שמור
                    </Button>
                  </div>
                </CardContent>
              ) : (
                // View Mode
                <>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base">{prompt.name}</CardTitle>
                        {prompt.is_active && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">פעיל</span>
                        )}
                        <span className="text-xs text-gray-500">
                          {prompt.language === 'both' ? 'עברית + عربية' : prompt.language === 'hebrew' ? 'עברית' : 'عربية'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Switch
                          checked={prompt.is_active}
                          onCheckedChange={(checked) => {
                            togglePromptMutation.mutate({ promptId: prompt.id, isActive: checked });
                          }}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => startEditing(prompt)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyToClipboard(prompt.prompt_text)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (confirm('למחוק את הפרומפט?')) {
                              deletePromptMutation.mutate(prompt.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed max-h-32 overflow-y-auto bg-white p-3 rounded-lg border">
                      {prompt.prompt_text.slice(0, 500)}...
                    </pre>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}