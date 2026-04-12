import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, BarChart2, Lightbulb, BookOpen, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <ClipboardCheck className="w-5 h-5 text-[#E85A24]" />,
    bg: 'bg-orange-100',
    title: 'בנו שאלון בדקות',
    desc: 'תארו את הפעילות, ו-AI יבנה עבורכם שאלון מותאם אישית',
  },
  {
    icon: <BarChart2 className="w-5 h-5 text-[#6B2D4A]" />,
    bg: 'bg-purple-100',
    title: 'תוצאות וניתוח חכם',
    desc: 'גרפים, ממוצעים ותובנות AI לפי כיתה ובית ספר בזמן אמת',
  },
];

export default function WelcomeModal({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-0 shadow-2xl" dir="rtl">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-[#E85A24] to-[#6B2D4A] px-7 pt-7 pb-8 text-white">
          <div className="flex justify-between items-start mb-4">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695a5f05dbd82ab5fc602da8/ca3e3ae45_2024.png"
              alt="עתיד"
              className="h-10 w-auto brightness-0 invert opacity-90"
            />
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
              ✦ גרסת בטא
            </span>
          </div>
          <h2 className="text-2xl font-black mb-1.5">מערכת הערכה ומדידה</h2>
          <p className="text-white/85 text-sm leading-relaxed">
            כלי דיגיטלי לאנשי חינוך — מדדו והבינו את ההשפעה של פעילויות והתערבויות בבתי הספר שלכם
          </p>
        </div>

        {/* Features */}
        <div className="px-7 pt-5 pb-4 space-y-3">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`w-9 h-9 ${f.bg} rounded-xl flex items-center justify-center shrink-0`}>
                {f.icon}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{f.title}</p>
                <p className="text-gray-500 text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Try now card */}
        <div className="px-7 pb-7">
          <div className="bg-gradient-to-l from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 bg-[#1E3A6E]/10 rounded-xl flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-[#1E3A6E]" />
              </div>
              <div>
                <p className="font-bold text-[#1E3A6E] text-sm">רוצים להתנסות עכשיו?</p>
                <p className="text-gray-600 text-xs leading-relaxed mt-0.5">
                  שאלון <strong>חזרה לשגרה</strong> כבר מוכן עבורכם — אין צורך ליצור כלום, פשוט שלחו לכיתות
                </p>
              </div>
            </div>

            {/* Animated CTA */}
            <Link to={createPageUrl('FixedSurveySetup')} onClick={onClose}>
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Button className="w-full bg-[#1E3A6E] hover:bg-[#162d57] text-white rounded-xl h-10 text-sm font-bold gap-2">
                  <BookOpen className="w-4 h-4" />
                  לחצו כאן להתנסות — שאלון חזרה לשגרה
                  <motion.span
                    animate={{ x: [0, -4, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </motion.span>
                </Button>
              </motion.div>
            </Link>
          </div>

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-gray-400 hover:text-gray-600 text-sm"
          >
            אסתכל קצת לפני שאתחיל
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}