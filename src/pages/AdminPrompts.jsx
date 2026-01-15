import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion } from 'framer-motion';
import { Lock, Sparkles, Save, RotateCcw, Copy, CheckCircle, Settings, Eye, EyeOff } from 'lucide-react';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [language, setLanguage] = useState('hebrew'); // hebrew or arabic
  const [customPrompt, setCustomPrompt] = useState('');
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [savedConfig, setSavedConfig] = useState(null);

  useEffect(() => {
    // Load saved config from localStorage
    const saved = localStorage.getItem(PROMPTS_STORAGE_KEY);
    if (saved) {
      const config = JSON.parse(saved);
      setSavedConfig(config);
      setLanguage(config.language || 'hebrew');
      setCustomPrompt(config.customPrompt || '');
      setUseCustomPrompt(config.useCustomPrompt || false);
    }
  }, []);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success('התחברת בהצלחה');
    } else {
      toast.error('סיסמה שגויה');
    }
  };

  const handleSave = () => {
    const config = {
      language,
      customPrompt,
      useCustomPrompt,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(config));
    setSavedConfig(config);
    toast.success('ההגדרות נשמרו בהצלחה');
  };

  const handleResetCustom = () => {
    setCustomPrompt('');
    setUseCustomPrompt(false);
    toast.success('הפרומפט המותאם נמחק');
  };

  const getDefaultPrompts = () => {
    if (language === 'arabic') {
      return { scale: DEFAULT_SCALE_PROMPT_AR, open: DEFAULT_OPEN_PROMPT_AR };
    }
    return { scale: DEFAULT_SCALE_PROMPT_HE, open: DEFAULT_OPEN_PROMPT_HE };
  };

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

  const defaults = getDefaultPrompts();

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
              <p className="text-xs text-gray-500">עדכון אחרון: {savedConfig?.lastUpdated ? new Date(savedConfig.lastUpdated).toLocaleString('he-IL') : 'לא נשמר'}</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            className="bg-[#E85A24] hover:bg-[#D14A1A] text-white"
          >
            <Save className="w-4 h-4 ml-2" />
            שמור הכל
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Language Selection */}
        <Card className="border-2 border-[#E85A24]">
          <CardHeader>
            <CardTitle className="text-lg text-[#6B2D4A]">שפת השאלונים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <label 
                className={`flex-1 flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${language === 'hebrew' ? 'bg-[#E85A24]/10 border-2 border-[#E85A24]' : 'bg-white border-2 border-gray-200 hover:border-gray-300'}`}
                onClick={() => setLanguage('hebrew')}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${language === 'hebrew' ? 'border-[#E85A24]' : 'border-gray-300'}`}>
                  {language === 'hebrew' && <div className="w-2.5 h-2.5 rounded-full bg-[#E85A24]" />}
                </div>
                <span className="font-medium">עברית</span>
              </label>
              
              <label 
                className={`flex-1 flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${language === 'arabic' ? 'bg-[#E85A24]/10 border-2 border-[#E85A24]' : 'bg-white border-2 border-gray-200 hover:border-gray-300'}`}
                onClick={() => setLanguage('arabic')}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${language === 'arabic' ? 'border-[#E85A24]' : 'border-gray-300'}`}>
                  {language === 'arabic' && <div className="w-2.5 h-2.5 rounded-full bg-[#E85A24]" />}
                </div>
                <span className="font-medium">عربية</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>משתנים זמינים בפרומפט:</strong><br />
              <code className="bg-blue-100 px-1 rounded">{'{activity_description}'}</code> - תיאור הפעילות<br />
              <code className="bg-blue-100 px-1 rounded">{'{audience}'}</code> - קהל יעד<br />
              <code className="bg-blue-100 px-1 rounded">{'{grades}'}</code> - שכבות גיל<br />
              <code className="bg-blue-100 px-1 rounded">{'{event_type}'}</code> - סוג האירוע<br />
              <code className="bg-blue-100 px-1 rounded">{'{content_focus}'}</code> - תחומי מיקוד<br />
              <code className="bg-blue-100 px-1 rounded">{'{values_section}'}</code> - ערכים למדידה<br />
              <code className="bg-blue-100 px-1 rounded">{'{knowledge_section}'}</code> - ידע למדידה<br />
              <code className="bg-blue-100 px-1 rounded">{'{skills_section}'}</code> - מיומנויות למדידה<br />
              <code className="bg-blue-100 px-1 rounded">{'{goals_section}'}</code> - מטרות ההערכה<br />
              <code className="bg-blue-100 px-1 rounded">{'{success_section}'}</code> - הגדרת הצלחה
            </p>
          </CardContent>
        </Card>

        {/* Custom Prompt Toggle */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#E85A24]" />
                <CardTitle className="text-lg text-[#6B2D4A]">פרומפט מותאם אישית</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="use-custom"
                  checked={useCustomPrompt}
                  onCheckedChange={setUseCustomPrompt}
                />
                <Label htmlFor="use-custom" className="text-sm">
                  {useCustomPrompt ? 'פרומפט מותאם פעיל' : 'משתמש בברירת מחדל'}
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {useCustomPrompt 
                ? 'הפרומפט המותאם שלך משמש ליצירת השאלונים. הפרומפטים הסטנדרטיים לא פעילים.' 
                : 'כרגע משתמשים בפרומפטים הסטנדרטיים לפי השפה שנבחרה.'}
            </p>
            
            {useCustomPrompt && (
              <div className="space-y-4">
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="כתוב כאן את הפרומפט המותאם שלך... הפרומפט צריך להחזיר JSON עם מערך questions הכולל את כל השאלות (דירוג + פתוחות)"
                  className="min-h-[400px] text-sm font-mono leading-relaxed"
                  dir="rtl"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(customPrompt)}>
                    <Copy className="w-4 h-4 ml-1" />
                    העתק
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleResetCustom}>
                    <RotateCcw className="w-4 h-4 ml-1" />
                    מחק פרומפט מותאם
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Default Prompts Preview (Read Only) */}
        {!useCustomPrompt && (
          <>
            <Card className="border-2 border-gray-200 bg-gray-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-gray-600">פרומפט ברירת מחדל - שאלות דירוג ({language === 'arabic' ? 'عربية' : 'עברית'})</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(defaults.scale)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto bg-white p-4 rounded-lg border">
                  {defaults.scale}
                </pre>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 bg-gray-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-gray-600">פרומפט ברירת מחדל - שאלות פתוחות ({language === 'arabic' ? 'عربية' : 'עברית'})</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(defaults.open)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto bg-white p-4 rounded-lg border">
                  {defaults.open}
                </pre>
              </CardContent>
            </Card>
          </>
        )}

        {/* Status */}
        <Card className={`border-2 ${useCustomPrompt ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className={`w-5 h-5 ${useCustomPrompt ? 'text-amber-600' : 'text-green-600'}`} />
              <div>
                <p className="font-medium text-gray-800">סטטוס נוכחי</p>
                <p className="text-sm text-gray-600">
                  שפה: {language === 'arabic' ? 'ערבית' : 'עברית'} | 
                  פרומפט: {useCustomPrompt ? 'מותאם אישית' : 'ברירת מחדל'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}