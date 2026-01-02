import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';

export default function StepWrapper({
  currentStep,
  totalSteps,
  stepLabel,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  onSaveDraft,
  isNextDisabled = false,
  isLoading = false,
  nextLabel = "הבא",
  showBack = true,
  showSaveDraft = true,
  direction = 1
}) {
  // Swipe gesture handling
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    e.currentTarget.dataset.touchStartX = touch.clientX;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const touchStartX = parseFloat(e.currentTarget.dataset.touchStartX);
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    // RTL: swipe left = next, swipe right = back
    if (Math.abs(diff) > 50) {
      if (diff > 0 && !isNextDisabled && onNext) {
        onNext();
      } else if (diff < 0 && showBack && onBack) {
        onBack();
      }
    }
  }, [isNextDisabled, onNext, onBack, showBack]);

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">שלב {currentStep} מתוך {totalSteps}</span>
            {showSaveDraft && (
              <button
                onClick={onSaveDraft}
                className="text-sm text-[#E85A24] hover:text-[#D14A1A] flex items-center gap-1 transition-colors"
              >
                <Save className="w-4 h-4" />
                שמור טיוטה
              </button>
            )}
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#E85A24] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {stepLabel && (
            <p className="text-xs text-gray-400 mt-1">{stepLabel}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: direction * 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -50 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col"
        >
          <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-[#6B2D4A] mb-2">
                {title}
              </h1>
              {subtitle && (
                <p className="text-gray-500 text-lg">{subtitle}</p>
              )}
            </div>

            <div className="flex-1">
              {children}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {showBack && (
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-6 text-gray-600 border-gray-200"
            >
              <ChevronRight className="w-5 h-5" />
              חזרה
            </Button>
          )}
          
          <Button
            onClick={onNext}
            disabled={isNextDisabled || isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-6 bg-[#E85A24] hover:bg-[#D14A1A] text-white text-lg font-medium"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {nextLabel}
                <ChevronLeft className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
        
        {/* Swipe hint for mobile */}
        <p className="text-center text-xs text-gray-400 mt-2 md:hidden">
          החלק שמאלה להמשיך, ימינה לחזור
        </p>
      </div>
    </div>
  );
}