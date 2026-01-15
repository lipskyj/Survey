import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GUIDELINES = [
  {
    order: 1,
    title: 'שפת השאלון',
    whatWeLearn: 'קובעת ניסוח, טון, מורכבות לשונית - לא קובעת ממדי מדידה',
    allowed: [
      'התאמת אורך משפטים',
      'פישוט / העמקה לשונית',
      'התאמת סגנון (ישיר / פורמלי)'
    ],
    forbidden: [
      'שינוי ממדי הערכה בגלל שפה',
      'שאלות שונות מהותית בין שפות'
    ],
    critical: 'השפה משפיעה על איך שואלים, לא על מה מודדים'
  },
  {
    order: 2,
    title: 'תיאור הפעילות (+ קובץ)',
    whatWeLearn: 'זהו מקור האמת - מגדיר מה קרה בפועל ומה ניתן למדידה',
    allowed: [
      'שאלות שמבוססות ישירות על תכנים',
      'שאלות מבוססות על מטרות',
      'מדידה של מבנה הפעילות',
      'מדידה של מרכיבים שתוארו בלבד'
    ],
    forbidden: [
      'שאלות על רכיב שלא הופיע בתיאור',
      'מדידה של "השפעות כלליות" שלא הוגדרו'
    ],
    critical: 'אין שאלה שאין לה עוגן בתיאור הפעילות'
  },
  {
    order: 3,
    title: 'קהל יעד',
    whatWeLearn: 'מי חווה את הפעילות, מי בעל הסוכנות, מהו סוג הידע הלגיטימי',
    byAudience: [
      {
        audience: 'תלמידים',
        allowed: ['חוויה אישית', 'תחושת משמעות', 'שינוי בתחושה / חשיבה', 'מעורבות, קושי, בהירות'],
        forbidden: ['יעילות פדגוגית', 'התאמה למטרות מערכתיות', 'שיקולי עלות–תועלת']
      },
      {
        audience: 'מורים',
        allowed: ['התאמה למטרות', 'איכות היישום', 'תרומה לתלמידים', 'המלצות לשיפור'],
        forbidden: ['חוויות רגשיות אישיות', 'שאלות "אהבתי / נהניתי"']
      },
      {
        audience: 'הורים',
        allowed: ['תפיסת שינוי אצל הילד', 'ערך חינוכי', 'תקשורת ושקיפות'],
        forbidden: ['מדידה ישירה של למידה', 'הערכה מקצועית של הוראה']
      },
      {
        audience: 'הנהלה',
        allowed: ['הלימה לאסטרטגיה', 'קיימות', 'כדאיות', 'החלטות המשך'],
        forbidden: ['חוויות סובייקטיביות', 'שאלות רגשיות']
      }
    ]
  },
  {
    order: 4,
    title: 'שכבות גיל',
    whatWeLearn: 'רמת הפשטה, עומק רפלקטיבי אפשרי',
    allowed: ['התאמת ניסוח', 'קיצור / הארכה', 'דוגמאות קונקרטיות'],
    forbidden: ['הכנסת ממדי מדידה חדשים', 'שאלות מורכבות מדי לגיל'],
    critical: 'גיל = התאמה, לא הרחבה'
  },
  {
    order: 5,
    title: 'אנונימי / שמי',
    whatWeLearn: 'רמת ביטחון הדיווח, עומק הביקורת האפשרי',
    byType: [
      {
        type: 'אנונימי',
        allowed: ['ביקורת', 'קושי', 'חוסר שביעות רצון', 'תחושות רגישות']
      },
      {
        type: 'שמי',
        allowed: ['שאלות תהליכיות', 'הצעות כלליות', 'ניסוחים זהירים']
      }
    ],
    forbidden: ['שאלות ביקורתיות חדות בסקר שמי', 'בקשת חשיפה אישית ללא אנונימיות']
  },
  {
    order: 6,
    title: 'אופי הפעילות',
    whatWeLearn: 'האם ניתן למדוד שינוי, האם יש תהליך',
    byType: [
      {
        type: 'חד־פעמית',
        allowed: ['משמעות', 'רלוונטיות', 'בהירות', 'רצון להמשך'],
        forbidden: ['שינוי לאורך זמן', 'השפעה מצטברת']
      },
      {
        type: 'מתמשכת / שנתית',
        allowed: ['תהליך', 'שינוי', 'התפתחות', 'עקביות'],
        forbidden: ['שאלות "רגעיות בלבד"']
      }
    ]
  },
  {
    order: 7,
    title: 'תחומי מיקוד (1–3)',
    whatWeLearn: 'מה חשוב באמת',
    allowed: ['לפחות שאלה אחת לכל תחום נבחר'],
    forbidden: ['שאלות מתחום שלא נבחר', 'שאלון רחב מהבחירה'],
    critical: 'מה שלא נבחר — אסור להימדד'
  },
  {
    order: 8,
    title: 'ערכים / ידע / מיומנויות',
    whatWeLearn: 'איך למדוד את המיקוד',
    allowed: ['מדידה ישירה של הפריטים שנבחרו', 'שאלות יישומיות'],
    forbidden: ['ערכים כלליים שלא הוגדרו', '"גם וגם" באותה שאלה']
  },
  {
    order: 9,
    title: 'הגדרת הצלחה',
    whatWeLearn: 'מהי החלטה אפשרית',
    allowed: ['שאלות שמאפשרות: שיפור, שימור, שינוי, הפסקה'],
    forbidden: ['שאלות שאין להן שימוש החלטי', '"נחמד לדעת"'],
    critical: 'אם תשובה לא משנה החלטה — השאלה מיותרת'
  }
];

const META_RULE = {
  title: 'כלל־על (Meta Rule)',
  checks: [
    'נשענת על הקלט',
    'מותרת לפי הקהל והאופי',
    'מאפשרת החלטה'
  ],
  critical: 'אם לא — למחוק.'
};

export default function QuestionLogicGuidelines() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300">
        <CardHeader>
          <CardTitle className="text-xl text-purple-900">
            🔒 מטריצת החלטה פנימית - Design Doc
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-purple-800 font-medium">
            המסמך הזה הוא אמת מערכתית - לא חלק גלוי מהפרומפט
          </p>
          <div className="bg-white border-2 border-purple-200 rounded-lg p-3 text-sm">
            <p className="text-purple-900">
              <strong>המשתמש בוחר</strong> → פרמטרים נכנסים למערכת<br/>
              <strong>הפרומפט שופט</strong> → מפעיל מסננים לפי מטריצה<br/>
              <strong>הלוגיקה לא מבקשת רשות</strong> → סינון אוטומטי
            </p>
          </div>
          <p className="text-xs text-gray-600">
            הכללים למטה מיושמים בפרומפט ככלל-על אחד: "Apply the internal decision matrix"
          </p>
        </CardContent>
      </Card>

      {GUIDELINES.map((guideline, index) => {
        const isExpanded = expandedIndex === index;
        
        return (
          <Card key={index} className="border-2 border-gray-200 hover:border-[#E85A24] transition-all">
            <CardHeader 
              className="cursor-pointer"
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#6B2D4A] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {guideline.order}
                  </div>
                  <CardTitle className="text-lg">{guideline.title}</CardTitle>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
              <p className="text-sm text-gray-600 mr-11 mt-1">{guideline.whatWeLearn}</p>
            </CardHeader>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="space-y-4">
                    {guideline.byAudience ? (
                      <div className="space-y-3">
                        {guideline.byAudience.map((item, idx) => (
                          <div key={idx} className="border-r-4 border-[#E85A24] pr-3">
                            <p className="font-bold text-[#6B2D4A] mb-2">{item.audience}</p>
                            <div className="space-y-2">
                              <div className="bg-green-50 p-3 rounded-lg">
                                <div className="flex items-start gap-2 mb-2">
                                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                  <p className="font-medium text-green-800 text-sm">מותר:</p>
                                </div>
                                <ul className="text-sm text-green-700 space-y-1 mr-6">
                                  {item.allowed.map((a, i) => <li key={i}>• {a}</li>)}
                                </ul>
                              </div>
                              <div className="bg-red-50 p-3 rounded-lg">
                                <div className="flex items-start gap-2 mb-2">
                                  <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                  <p className="font-medium text-red-800 text-sm">אסור:</p>
                                </div>
                                <ul className="text-sm text-red-700 space-y-1 mr-6">
                                  {item.forbidden.map((f, i) => <li key={i}>• {f}</li>)}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : guideline.byType ? (
                      <div className="space-y-3">
                        {guideline.byType.map((item, idx) => (
                          <div key={idx} className="border-r-4 border-[#E85A24] pr-3">
                            <p className="font-bold text-[#6B2D4A] mb-2">{item.type}</p>
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="flex items-start gap-2 mb-2">
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                <p className="font-medium text-green-800 text-sm">מותר:</p>
                              </div>
                              <ul className="text-sm text-green-700 space-y-1 mr-6">
                                {item.allowed.map((a, i) => <li key={i}>• {a}</li>)}
                              </ul>
                            </div>
                            {item.forbidden && (
                              <div className="bg-red-50 p-3 rounded-lg mt-2">
                                <div className="flex items-start gap-2 mb-2">
                                  <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                  <p className="font-medium text-red-800 text-sm">אסור:</p>
                                </div>
                                <ul className="text-sm text-red-700 space-y-1 mr-6">
                                  {item.forbidden.map((f, i) => <li key={i}>• {f}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                        {guideline.forbidden && (
                          <div className="bg-red-50 p-3 rounded-lg">
                            <div className="flex items-start gap-2 mb-2">
                              <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                              <p className="font-medium text-red-800 text-sm">אסור לכולם:</p>
                            </div>
                            <ul className="text-sm text-red-700 space-y-1 mr-6">
                              {guideline.forbidden.map((f, i) => <li key={i}>• {f}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {guideline.allowed && (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="flex items-start gap-2 mb-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <p className="font-medium text-green-800 text-sm">מותר:</p>
                            </div>
                            <ul className="text-sm text-green-700 space-y-1 mr-6">
                              {guideline.allowed.map((a, i) => <li key={i}>• {a}</li>)}
                            </ul>
                          </div>
                        )}
                        {guideline.forbidden && (
                          <div className="bg-red-50 p-3 rounded-lg">
                            <div className="flex items-start gap-2 mb-2">
                              <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                              <p className="font-medium text-red-800 text-sm">אסור:</p>
                            </div>
                            <ul className="text-sm text-red-700 space-y-1 mr-6">
                              {guideline.forbidden.map((f, i) => <li key={i}>• {f}</li>)}
                            </ul>
                          </div>
                        )}
                      </>
                    )}

                    {guideline.critical && (
                      <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="font-bold text-amber-900 text-sm">{guideline.critical}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}

      {/* Meta Rule */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
        <CardHeader>
          <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            {META_RULE.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-medium text-purple-800">כל שאלה חייבת לעבור 3 בדיקות:</p>
          <div className="space-y-2">
            {META_RULE.checks.map((check, i) => (
              <div key={i} className="flex items-center gap-2 bg-white p-2 rounded">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <p className="text-purple-900">{check}</p>
              </div>
            ))}
          </div>
          <div className="bg-red-100 border-2 border-red-400 p-3 rounded-lg">
            <p className="font-bold text-red-900 text-center">{META_RULE.critical}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}