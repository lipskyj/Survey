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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from 'framer-motion';
import { Lock, Sparkles, Save, Copy, CheckCircle, Settings, Eye, EyeOff, Plus, Trash2, Edit2, Home, BookOpen, BarChart3, Star, MessageSquare, Users, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import QuestionLogicGuidelines from '../components/QuestionLogicGuidelines';
import SurveyAdminCard from '../components/SurveyAdminCard';
import AppFeedbackTab from '../components/AppFeedbackTab';

const ADMIN_PASSWORD = '1234';

// Default prompts storage key
const PROMPTS_STORAGE_KEY = 'admin_prompts_config';

const DEFAULT_UNIFIED_PROMPT_HE = `אתה מומחה להערכת חוויית למידה חינוכית.

🔒 כלל־על פנימי:
Apply the internal decision matrix governing allowed and forbidden question types based on user inputs.
המשתמש בוחר → הפרומפט שופט → הלוגיקה לא מבקשת רשות.

🎯 עקרון המפתח: מדוד חוויה קונקרטית באמצעות שאלות סולם
═══════════════════════════════════════
להפסיק לשאול מה אנשים חושבים, ולהתחיל למדוד מה קרה להם בפועל.
כל שאלה צריכה למדוד ממד אחד, ברור וניתן לכימות: בהירות, שינוי, תרומה, קושי, שימושיות, משמעות.

⚡ סינון דינמי:
• שאלות מבוססות אך ורק על הקלט שהתקבל
• מותרות לפי קהל יעד, אופי הפעילות, ואנונימיות
• מאפשרות החלטה ברורה

‼️ חובה מוחלטת:
כל שאלות הסולם חייבות להתחיל ב"עד כמה" או "באיזו מידה" - אין חריגים!
⛔ אסור לחלוטין להשתמש ב"כמה טוב", "מה", "האם", "כמה" בלבד — תמיד "עד כמה" / "באיזו מידה"!
⛔ אסור להשתמש במושגים מקצועיים שאינם מובנים לתלמידים (לוגיסטיקה, פדגוגי, אסטרטגיה וכד׳) — שפה פשוטה בלבד!
⛔ כתיב הרמות (low/high) חייב להיות עקבי ומקצועי: "כלל לא" ← "במידה רבה מאוד" (ולא "מאוד הרבה", "מעט", "הרבה מאוד")!

═══════════════════════════════════════
🔒 מטריצת החלטה פנימית - מפעילים לפני יצירת כל שאלה
═══════════════════════════════════════

⚠️ כלל מס' 3 - קהל יעד (CRITICAL - יישום מיידי):

📌 תלמידים - מותר:
• חוויה אישית ("עד כמה נהניתי", "באיזו מידה הרגשתי")
• תחושת משמעות, שינוי בתחושה/חשיבה
• מעורבות, קושי, בהירות
📌 תלמידים - אסור:
• יעילות פדגוגית, התאמה למטרות מערכתיות
• שימוש במילים: לוגיסטיקה, פדגוגי, מתודולוגיה, אסטרטגיה — מילים שתלמידים לא מכירים
• ניסוח "כמה טוב", "באיזה מידה טוב" — תמיד "עד כמה" / "באיזו מידה"

📌 מורים - מותר:
• התאמה למטרות ("עד כמה הפעילות תרמה לתלמידים")
• איכות היישום ("באיזו מידה הביצוע היה איכותי")
• תרומה לתלמידים (מבחינה חיצונית)
• המלצות לשיפור
📌 מורים - אסור:
• חוויות רגשיות אישיות ("עד כמה נהניתי", "עד כמה חידשה לי ידע")
• שאלות "אהבתי / נהניתי"
• כל שאלה שמתמקדת בחוויה האישית של המורה

📌 הורים - מותר:
• תפיסת שינוי אצל הילד ("עד כמה ראיתי שינוי בילד/ה")
• ערך חינוכי, תקשורת ושקיפות
📌 הורים - אסור:
• מדידה ישירה של למידה, הערכה מקצועית של הוראה

📌 הנהלה - מותר:
• הלימה לאסטרטגיה, קיימות, כדאיות
• החלטות המשך
📌 הנהלה - אסור:
• חוויות סובייקטיביות, שאלות רגשיות

⚠️ כלל על: כל שאלה חייבת לעבור 3 בדיקות:
1️⃣ נשענת על הקלט (תיאור הפעילות)
2️⃣ מותרת לפי הקהל והאופי
3️⃣ מאפשרת החלטה
❌ אם לא - למחוק מיידית!

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
📐 עקרונות למדידת חוויה:
═══════════════════════════════════════
1. כל סולם מודד דבר אחד ברור וניתן למדידה
2. השתמש בצירים שונים: עוצמה, תדירות, התאמה, קצב, בהירות, השפעה
3. כל שאלה צריכה לענות על: "איזו החלטה תשתנה לפי התשובה?"
4. מדוד את התכנון והעיצוב החינוכי, לא אנשים
5. מספרים מראים איפה הבעיה, לא מה הבעיה

═══════════════════════════════════════
🎯 ממדי מדידה מומלצים:
═══════════════════════════════════════
• עוצמת למידה - באיזו מידה הפעילות חידשה ידע או הבנה
• בהירות - עד כמה היה ברור מה מטרת הפעילות ומה מצופה
• רלוונטיות אישית - עד כמה התכנים רלוונטיים לחיים
• תרומה לחשיבה - באיזו מידה הפעילות גרמה לחשוב אחרת
• רמת מעורבות - עד כמה הרגשת מעורב/ת ופעיל/ה
• התאמת רמת קושי - האם הייתה קלה מדי / מתאימה / קשה מדי
• תחושת משמעות - עד כמה הרגישה משמעותית
• שימוש בזמן - עד כמה הזמן נוצל היטב
• תחושת קול - עד כמה היה מקום להביע דעה ולהשפיע
• רצון להמשך - עד כמה תרצה להשתתף בפעילות דומה

═══════════════════════════════════════
⚠️ הנחיות מחייבות:
═══════════════════════════════════════
1. ✅ כל שאלה מודדת ממד אחד ברור בלבד
2. ✅ השתמש בניסוח "עד כמה", "באיזו מידה", "איך היית מדרג"
3. ✅ הסולם בין 1-5 עם תיאור ברור של הקצוות
4. ✅ הקצוות חייבים להיות עקביים ומקצועיים:
   - "כלל לא" ← "במידה רבה מאוד" (לא "הרבה מאוד" / "מאוד הרבה"!)
   - "לא ברור בכלל" ← "ברור מאוד"
   - "קלה מדי" ← "קשה מדי"
   - "לא רלוונטי בכלל" ← "רלוונטי מאוד"
5. ✅ שאלות קצרות - עד 20 מילים
6. ✅ הימנע משאלות "האם אהבת" - התמקד במדידות קונקרטיות
7. ✅ שפה מותאמת לקהל: לתלמידים — שפה פשוטה ויומיומית, ללא מושגים מקצועיים
8. ✅ נוסח השאלה חייב להתאים למה שנאמר בתיאור הפעילות (תוכנית/פעילות/קורס/הרצאה) ולא גנרי

{student_language_section}

═══════════════════════════════════════
🚫 שגיאות נפוצות — לא לחזור עליהן:
═══════════════════════════════════════
❌ "כמה טוב..." → ✅ "עד כמה..." / "באיזו מידה..."
❌ "מאוד הרבה" / "הרבה מאוד" (בתיאור קצוות) → ✅ "במידה רבה מאוד"
❌ "לוגיסטיקה", "פדגוגי" בשאלות לתלמידים → ✅ "ארגון", "איכות ההוראה"
❌ שאלה גנרית שלא מתייחסת לפעילות הספציפית → ✅ נסח עם הקשר לפעילות שתוארה

═══════════════════════════════════════
📊 מבנה השאלון הנדרש:
═══════════════════════════════════════
צור בדיוק 10 שאלות למדידת חוויה, מגוונות בממדים:

1. עוצמת למידה / חדשנות
2. בהירות ומובנות
3. רלוונטיות לחיים
4. תרומה לחשיבה / שינוי תפיסה
5. רמת מעורבות
6. התאמת רמת קושי
7. תחושת משמעות
8. שימוש בזמן / ניצול זמן
9. תחושת קול / יכולת להשפיע
10. רצון להמשך / תרומה אישית

‼️ CRITICAL - קריטי ביותר:
כל שאלה חייבת להיות שאלת מדידה בסולם ולא היגד הסכמה או שאלה פתוחה!

❌ אסור - שאלות פתוחות מסווגות בטעות כשאלות סולם:
- "מה היו המטרות שלך?" ← זו שאלה פתוחה! אסור בחלק שאלות הסולם!
- "מה הייתה החוויה המשמעותית ביותר שלך?" ← זו שאלה פתוחה!
- "איזה שינוי חשבת שקרה אצלך?" ← זו שאלה פתוחה!
- "איזה ידע או מיומנויות פיתחת?" ← זו שאלה פתוחה!
- "מה למדת?" ← זו שאלה פתוחה!
- כל שאלה שמתחילה ב"מה", "איזה", "איך" - זו שאלה פתוחה!

❌ אסור - שאלות שמכוונות לקהל לא נכון:
- עבור מורים: "עד כמה הפעילות חידשה לך ידע" ← חוויה אישית אסורה למורים!
- עבור מורים: "עד כמה נהניתי" ← רגש אישי אסור למורים!
- עבור תלמידים: "עד כמה הפעילות השיגה מטרות פדגוגיות" ← שאלה מערכתית אסורה לתלמידים!

✅ חובה - שאלות מדידה בסולם בלבד:
עבור תלמידים:
- "באיזו מידה הפעילות חידשה לך ידע או הבנה?" (1 = כלל לא | 5 = במידה רבה מאוד)
- "עד כמה היה לך ברור מה מטרת הפעילות?" (1 = לא ברור | 5 = ברור מאוד)
- "עד כמה התכנים היו רלוונטיים לחיים שלך?" (1 = לא רלוונטיים | 5 = רלוונטיים מאוד)

עבור מורים:
- "באיזו מידה הפעילות תרמה לתלמידים?" (1 = כלל לא | 5 = במידה רבה מאוד)
- "עד כמה הביצוע של הפעילות היה איכותי?" (1 = לא איכותי | 5 = איכותי מאוד)
- "באיזו מידה הפעילות התאימה למטרות החינוכיות?" (1 = לא התאימה | 5 = התאימה מאוד)

הכלל: כל שאלה מתחילה ב"עד כמה", "באיזו מידה" + ממד מדיד + סולם ברור!
בדוק פעמיים שהשאלה מתאימה לקהל היעד!

═══════════════════════════════════════
📤 פורמט התשובה:
═══════════════════════════════════════
החזר JSON עם מערך של 10 שאלות בדיוק.
כל שאלה כוללת:
- prompt: השאלה בעברית (עד כמה / באיזו מידה...)
- scale_labels: {"low": "תיאור הקצה הנמוך", "high": "תיאור הקצה הגבוה"}
- kit_domain: אחד מ: relevance, skills, delivery_quality, belonging

דוגמה:
{
  "questions": [
    {
      "prompt": "באיזו מידה הפעילות חידשה לך ידע או הבנה שלא היו לך קודם?",
      "scale_labels": {"low": "כלל לא", "high": "במידה רבה מאוד"},
      "kit_domain": "skills"
    },
    {
      "prompt": "עד כמה היה לך ברור מה מטרת הפעילות ומה מצופה ממך?",
      "scale_labels": {"low": "לא ברור בכלל", "high": "ברור מאוד"},
      "kit_domain": "delivery_quality"
    }
  ]
}

═══════════════════════════════════════
📝 חלק ב': שאלות פתוחות (4 שאלות)
═══════════════════════════════════════

🎯 עקרון מנחה:
השאלות הפתוחות משלימות את שאלות הדירוג - לא חוזרות עליהן!
מספרים מראים לאן להסתכל; שאלות פתוחות מסבירות למה.

צור בדיוק 4 שאלות פתוחות:

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

⚠️ הנחיות לשאלות הפתוחות:
• {audience_language}
• {ongoing_note}
• שאלות קצרות וברורות
• לא לחזור על אותם רעיונות משאלות הדירוג

═══════════════════════════════════════
📤 פורמט תשובה סופי - JSON אחד מאוחד:
═══════════════════════════════════════
{
  "scale_questions": [
    {
      "prompt": "באיזו מידה...",
      "scale_labels": {"low": "...", "high": "..."},
      "kit_domain": "skills"
    }
    // ... 10 שאלות סולם
  ],
  "open_questions": [
    {"prompt": "שאלה פתוחה 1"},
    {"prompt": "שאלה פתוחה 2"},
    {"prompt": "שאלה פתוחה 3"},
    {"prompt": "שאלה פתוחה 4"}
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

  useEffect(() => {
    if (isAuthenticated) {
      ensureDefaultPromptsExist();
    }
  }, [isAuthenticated]);

  const ensureDefaultPromptsExist = async () => {
    try {
      const allPrompts = await base44.entities.AdminPrompt.list();
      const hasDefaultUnified = allPrompts.some(p => p.name === 'פרומפט מאוחד - ברירת מחדל');

      if (!hasDefaultUnified) {
        await base44.entities.AdminPrompt.create({
          name: 'פרומפט מאוחד - ברירת מחדל',
          prompt_text: DEFAULT_UNIFIED_PROMPT_HE,
          is_active: false,
          language: 'hebrew',
          notes: 'פרומפט מאוחד לשאלות דירוג ושאלות פתוחות - הפרומפט הסטנדרטי של המערכת'
        });
        queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
      }
    } catch (error) {
      console.error('Error creating default prompts:', error);
    }
  };

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

  const { data: feedbacks = [], isLoading: feedbacksLoading } = useQuery({
    queryKey: ['prompt-feedbacks'],
    queryFn: () => base44.entities.PromptFeedback.list('-created_date', 200),
    enabled: isAuthenticated
  });

  const { data: allSurveys = [] } = useQuery({
    queryKey: ['admin-all-surveys'],
    queryFn: () => base44.entities.Survey.list('-created_date', 200),
    enabled: isAuthenticated
  });

  const { data: allResponses = [] } = useQuery({
    queryKey: ['admin-all-responses'],
    queryFn: () => base44.entities.SurveyResponse.list('-created_date', 500),
    enabled: isAuthenticated
  });

  // Group feedbacks by prompt
  const feedbackGrouped = feedbacks.reduce((acc, fb) => {
    if (!acc[fb.prompt_name]) acc[fb.prompt_name] = [];
    acc[fb.prompt_name].push(fb);
    return acc;
  }, {});
  const promptStats = Object.entries(feedbackGrouped).map(([name, items]) => ({
    name,
    count: items.length,
    avg: (items.reduce((s, i) => s + (i.stars || 0), 0) / items.length).toFixed(1),
    feedbacks: items
  })).sort((a, b) => b.avg - a.avg);

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

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="prompts" dir="rtl">
          <TabsList className="mb-6 flex-wrap gap-1">
            <TabsTrigger value="prompts" className="gap-2">
              <Sparkles className="w-4 h-4" />
              פרומפטים
            </TabsTrigger>
            <TabsTrigger value="feedbacks" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              משובים
            </TabsTrigger>
            <TabsTrigger value="surveys" className="gap-2">
              <FileText className="w-4 h-4" />
              כל הסקרים
            </TabsTrigger>
            <TabsTrigger value="guidelines" className="gap-2">
              <BookOpen className="w-4 h-4" />
              הנחיות לוגיקה
            </TabsTrigger>
            <TabsTrigger value="app_feedback" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              משובי מערכת
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompts" className="space-y-6">
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

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            💡 <strong>השוואת פרומפטים:</strong> כעת תוכל להפעיל מספר פרומפטים במקביל. המערכת תיצור גרסת סקר נפרדת לכל פרומפט פעיל, וכך תוכל להשוות תוצאות ולבחור את הטובה ביותר.
          </p>
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

          {prompts.map((prompt) => {
            const isDefault = prompt.name.includes('ברירת מחדל');
            return (
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
                        {isDefault && (
                          <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">מובנה</span>
                        )}
                        {prompt.is_active && (
                          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">פעיל</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Switch
                          checked={prompt.is_active}
                          onCheckedChange={(checked) => {
                            togglePromptMutation.mutate({ promptId: prompt.id, isActive: checked });
                          }}
                        />
                        {!isDefault && (
                          <>
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
                              onClick={() => {
                                if (confirm('למחוק את הפרומפט?')) {
                                  deletePromptMutation.mutate(prompt.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyToClipboard(prompt.prompt_text)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto bg-white p-3 rounded-lg border">
                      {prompt.prompt_text}
                    </pre>
                  </CardContent>
                </>
              )}
              </Card>
            );
          })}
        </div>
          </TabsContent>

          <TabsContent value="feedbacks" className="space-y-6">
            {feedbacksLoading && <div className="text-center py-12"><Loader2 className="w-8 h-8 text-[#E85A24] animate-spin mx-auto" /></div>}
            {!feedbacksLoading && feedbacks.length === 0 && (
              <Card><CardContent className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>עדיין אין משובים</p>
              </CardContent></Card>
            )}
            {promptStats.map((stat) => (
              <Card key={stat.name} className="border-2 border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-[#6B2D4A]">{stat.name}</CardTitle>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{stat.count} משובים</span>
                      <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-yellow-700">{stat.avg}</span>
                        <span className="text-xs text-gray-500">/ 5</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2" dir="ltr">
                    {[1,2,3,4,5].map(s => {
                      const cnt = stat.feedbacks.filter(f => f.stars === s).length;
                      const pct = stat.count > 0 ? (cnt / stat.count) * 100 : 0;
                      return (
                        <div key={s} className="flex-1 text-center">
                          <div className="h-12 bg-gray-100 rounded relative flex items-end">
                            <div className="bg-yellow-400 rounded w-full" style={{ height: `${Math.max(pct, 4)}%` }} />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{s}★</p>
                        </div>
                      );
                    })}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-72 overflow-y-auto">
                  {stat.feedbacks.filter(f => f.comment).map((fb) => (
                    <div key={fb.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-1 mb-1" dir="ltr">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= fb.stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                        {fb.audience && <span className="text-xs text-gray-400 mr-2">| {fb.audience}</span>}
                      </div>
                      <p className="text-gray-700">{fb.comment}</p>
                    </div>
                  ))}
                  {stat.feedbacks.filter(f => !f.comment).length > 0 && (
                    <p className="text-xs text-gray-400 text-center">{stat.feedbacks.filter(f => !f.comment).length} דירוגים ללא הערה</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="surveys" className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-[#6B2D4A]" />
              <h2 className="font-bold text-lg text-[#6B2D4A]">כל הסקרים ({allSurveys.length})</h2>
            </div>
            {allSurveys.map((s) => {
              const surveyResponses = allResponses.filter(r => r.survey_id === s.id && r.is_complete);
              const responseCount = surveyResponses.length;
              return (
                <SurveyAdminCard key={s.id} survey={s} responses={surveyResponses} responseCount={responseCount} />
              );
            })}
          </TabsContent>

          <TabsContent value="guidelines">
            <QuestionLogicGuidelines />
          </TabsContent>

          <TabsContent value="app_feedback">
            <AppFeedbackTab />
          </TabsContent>
        </Tabs>
        </div>
        </div>
        );
        }