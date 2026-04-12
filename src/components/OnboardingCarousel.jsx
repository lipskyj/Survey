import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, FileEdit, Sparkles, Share2, BarChart2 } from 'lucide-react';

const ONBOARDING_STEPS = [
  {
    icon: FileEdit,
    title: 'תאר את הפעילות',
    description: 'ספר לנו על הפעילות החינוכית - אנחנו נטפל בשאר',
    color: 'bg-blue-50 text-blue-600'
  },
  {
    icon: Sparkles,
    title: 'AI יוצר את השאלות',
    description: 'המערכת מייצרת סקר מקצועי מבוסס KIT אוטומטית',
    color: 'bg-purple-50 text-purple-600'
  },
  {
    icon: Share2,
    title: 'שתף עם הקהל',
    description: 'שלח קישור לתלמידים, הורים או צוות — מכל מכשיר, בכל זמן',
    color: 'bg-orange-50 text-[#E85A24]'
  },
  {
    icon: BarChart2,
    title: 'קבל תוצאות והפק מסקנות',
    description: 'צפה בנתונים בזמן אמת וקבל תובנות AI חכמות להמשך הפעילות',
    color: 'bg-green-50 text-green-600'
  }
];

function CarouselContent({ onDismiss }) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) setCurrentStep(currentStep + 1);
    else onDismiss();
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;

  return (
    <>
      <button onClick={onDismiss} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors">
        <X className="w-5 h-5" />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="text-center py-4"
        >
          <div className={`w-16 h-16 sm:w-20 sm:h-20 ${step.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[#6B2D4A] mb-3">{step.title}</h3>
          <p className="text-sm sm:text-base text-gray-600 font-medium mb-8 max-w-md mx-auto">{step.description}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center gap-2 mb-6">
        {ONBOARDING_STEPS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentStep(idx)}
            className={`h-2 rounded-full transition-all ${idx === currentStep ? 'w-8 bg-[#E85A24]' : 'w-2 bg-gray-200 hover:bg-gray-300'}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={prevStep} disabled={currentStep === 0} className="text-gray-600 disabled:opacity-0">
          <ChevronRight className="w-5 h-5 ml-1" />
          קודם
        </Button>
        <Button onClick={nextStep} className="bg-[#E85A24] hover:bg-[#D14A1A] text-white rounded-full px-8 font-bold">
          {currentStep === ONBOARDING_STEPS.length - 1 ? 'בואו נתחיל' : 'הבא'}
          <ChevronLeft className="w-5 h-5 mr-1" />
        </Button>
      </div>
    </>
  );
}

export default function OnboardingCarousel({ onDismiss, asModal = false }) {
  if (asModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden w-full max-w-sm">
          <CarouselContent onDismiss={onDismiss} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
      <CarouselContent onDismiss={onDismiss} />
    </div>
  );
}