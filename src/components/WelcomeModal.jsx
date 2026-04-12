import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, BarChart2, Lightbulb, School } from 'lucide-react';

export default function WelcomeModal({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl" dir="rtl">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#E85A24] to-[#6B2D4A] px-8 pt-8 pb-6 text-white text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
            ✦ גרסת בטא בניסיון
          </div>
          <h2 className="text-2xl font-black mb-2">ברוכים הבאים למערכת ההערכה</h2>
          <p className="text-white/85 text-sm leading-relaxed">
            כלי דיגיטלי לאנשי חינוך — למדוד, להבין ולשפר פעילויות והתערבויות בבתי הספר
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            המערכת מאפשרת לכם לבנות שאלוני הערכה מותאמים אישית לכל פעילות — ולקבל תמונה ברורה של ההשפעה שלה על התלמידים.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-5 h-5 text-[#E85A24]" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">בנו שאלון בדקות</p>
                <p className="text-gray-500 text-xs">תארו את הפעילות, ו-AI יבנה עבורכם שאלון מותאם</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                <School className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">שלחו לכיתות בקלות</p>
                <p className="text-gray-500 text-xs">צרו קישור ייחודי לכל כיתה — קבלו תגובות בזמן אמת</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                <BarChart2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">ראו תוצאות וניתוח</p>
                <p className="text-gray-500 text-xs">גרפים, ממוצעים ותובנות מבוססות AI לפי כיתה ובית ספר</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">דוגמה: שאלון חזרה לשגרה</p>
                <p className="text-gray-500 text-xs">שאלון מוכן לאחר חופשה / מלחמה — דוגמה למה שניתן לבנות</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-7">
          <Button
            onClick={onClose}
            className="w-full bg-[#E85A24] hover:bg-[#D14A1A] text-white rounded-2xl h-12 text-base font-bold"
          >
            בואו נתחיל →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}