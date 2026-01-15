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

const DEFAULT_SCALE_PROMPT = `אתה מומחה להערכה בית ספרית מבוסס על "ערכה להערכת תכניות ופעילויות בית ספריות" של רשת עתיד.

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

const DEFAULT_OPEN_PROMPT = `אתה מומחה להערכה בית ספרית. צור שאלות פתוחות לסקר משוב.

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

export default function AdminPrompts() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [scalePrompt, setScalePrompt] = useState('');
  const [openPrompt, setOpenPrompt] = useState('');
  const [useCustomScalePrompt, setUseCustomScalePrompt] = useState(false);
  const [useCustomOpenPrompt, setUseCustomOpenPrompt] = useState(false);
  const [savedConfig, setSavedConfig] = useState(null);

  useEffect(() => {
    // Load saved config from localStorage
    const saved = localStorage.getItem(PROMPTS_STORAGE_KEY);
    if (saved) {
      const config = JSON.parse(saved);
      setSavedConfig(config);
      setScalePrompt(config.scalePrompt || DEFAULT_SCALE_PROMPT);
      setOpenPrompt(config.openPrompt || DEFAULT_OPEN_PROMPT);
      setUseCustomScalePrompt(config.useCustomScalePrompt || false);
      setUseCustomOpenPrompt(config.useCustomOpenPrompt || false);
    } else {
      setScalePrompt(DEFAULT_SCALE_PROMPT);
      setOpenPrompt(DEFAULT_OPEN_PROMPT);
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
      scalePrompt,
      openPrompt,
      useCustomScalePrompt,
      useCustomOpenPrompt,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(config));
    setSavedConfig(config);
    toast.success('ההגדרות נשמרו בהצלחה');
  };

  const handleResetScale = () => {
    setScalePrompt(DEFAULT_SCALE_PROMPT);
    toast.success('פרומפט שאלות הדירוג אופס לברירת המחדל');
  };

  const handleResetOpen = () => {
    setOpenPrompt(DEFAULT_OPEN_PROMPT);
    toast.success('פרומפט השאלות הפתוחות אופס לברירת המחדל');
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
        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>משתנים זמינים בפרומפט:</strong><br />
              <code className="bg-blue-100 px-1 rounded">{'{activity_description}'}</code> - תיאור הפעילות<br />
              <code className="bg-blue-100 px-1 rounded">{'{audience}'}</code> - קהל יעד<br />
              <code className="bg-blue-100 px-1 rounded">{'{grades}'}</code> - שכבות גיל<br />
              <code className="bg-blue-100 px-1 rounded">{'{event_type}'}</code> - סוג האירוע<br />
              <code className="bg-blue-100 px-1 rounded">{'{content_focus}'}</code> - תחומי מיקוד
            </p>
          </CardContent>
        </Card>

        {/* Scale Questions Prompt */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#E85A24]" />
                <CardTitle className="text-lg text-[#6B2D4A]">פרומפט שאלות דירוג (10 היגדים)</CardTitle>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="use-scale"
                    checked={useCustomScalePrompt}
                    onCheckedChange={setUseCustomScalePrompt}
                  />
                  <Label htmlFor="use-scale" className="text-sm">
                    {useCustomScalePrompt ? 'פרומפט מותאם פעיל' : 'ברירת מחדל'}
                  </Label>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(scalePrompt)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleResetScale}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={scalePrompt}
              onChange={(e) => setScalePrompt(e.target.value)}
              className="min-h-[400px] text-sm font-mono leading-relaxed"
              dir="rtl"
            />
          </CardContent>
        </Card>

        {/* Open Questions Prompt */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#E85A24]" />
                <CardTitle className="text-lg text-[#6B2D4A]">פרומפט שאלות פתוחות (4 שאלות)</CardTitle>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="use-open"
                    checked={useCustomOpenPrompt}
                    onCheckedChange={setUseCustomOpenPrompt}
                  />
                  <Label htmlFor="use-open" className="text-sm">
                    {useCustomOpenPrompt ? 'פרומפט מותאם פעיל' : 'ברירת מחדל'}
                  </Label>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(openPrompt)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleResetOpen}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={openPrompt}
              onChange={(e) => setOpenPrompt(e.target.value)}
              className="min-h-[300px] text-sm font-mono leading-relaxed"
              dir="rtl"
            />
          </CardContent>
        </Card>

        {/* Status */}
        <Card className={`border-2 ${useCustomScalePrompt || useCustomOpenPrompt ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className={`w-5 h-5 ${useCustomScalePrompt || useCustomOpenPrompt ? 'text-green-600' : 'text-gray-400'}`} />
              <div>
                <p className="font-medium text-gray-800">סטטוס פרומפטים</p>
                <p className="text-sm text-gray-600">
                  שאלות דירוג: {useCustomScalePrompt ? 'פרומפט מותאם' : 'ברירת מחדל'} | 
                  שאלות פתוחות: {useCustomOpenPrompt ? 'פרומפט מותאם' : 'ברירת מחדל'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}