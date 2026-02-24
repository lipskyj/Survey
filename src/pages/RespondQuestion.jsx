import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

async function publicApi(action, params = {}) {
  const res = await base44.functions.invoke('publicSurvey', { action, ...params });
  return res.data.data;
}
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, Check } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function RespondQuestion() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [survey, setSurvey] = useState(null);
  const [responseId, setResponseId] = useState(null);
  const [slug, setSlug] = useState('');
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('s');
      const r = params.get('r');
      const q = parseInt(params.get('q') || '0');
      
      setSlug(s);
      setResponseId(r);
      setCurrentIndex(q);

      // Load survey
      const surveys = await publicApi('getSurveyBySlug', { slug: s });
      if (surveys.length > 0) {
        setSurvey(surveys[0]);
        
        // Load questions
        const qs = await publicApi('getQuestions', { survey_id: surveys[0].id });
        setQuestions(qs);

        // Load existing answers
        if (r) {
          const responses = await publicApi('getResponse', { id: r });
          if (responses.length > 0 && responses[0].answers) {
            const existingAnswers = {};
            responses[0].answers.forEach(a => {
              existingAnswers[a.question_id] = a.value;
            });
            setAnswers(existingAnswers);
          }
        }
      }
      
      setIsLoading(false);
    };
    loadData();
  }, []);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (value) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const saveProgress = async () => {
    if (!responseId) return;
    
    const answersArray = Object.entries(answers).map(([questionId, value]) => {
      const q = questions.find(qu => qu.id === questionId);
      return {
        question_id: questionId,
        question_type: q?.question_type || 'scale_5',
        value: String(value),
        numeric_value: typeof value === 'number' ? value : null
      };
    });

    await publicApi('updateResponse', { id: responseId, data: { answers: answersArray } });
  };

  const handleNext = async () => {
    await saveProgress();
    
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
      navigate(createPageUrl('RespondQuestion') + `?s=${slug}&r=${responseId}&q=${currentIndex + 1}`, { replace: true });
    } else {
      // Complete survey
      await publicApi('updateResponse', { id: responseId, data: { is_complete: true, completed_at: new Date().toISOString() } });
      
      // Update survey response count
      await publicApi('updateSurveyCount', { survey_id: survey.id });
      
      navigate(createPageUrl('RespondComplete') + `?s=${slug}`);
    }
  };

  const handleBack = async () => {
    if (currentIndex > 0) {
      await saveProgress();
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
      navigate(createPageUrl('RespondQuestion') + `?s=${slug}&r=${responseId}&q=${currentIndex - 1}`, { replace: true });
    }
  };

  // Swipe handling
  const handleTouchStart = useCallback((e) => {
    e.currentTarget.dataset.touchStartX = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const touchStartX = parseFloat(e.currentTarget.dataset.touchStartX);
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && answers[currentQuestion?.id]) {
        handleNext();
      } else if (diff < 0 && currentIndex > 0) {
        handleBack();
      }
    }
  }, [currentIndex, answers, currentQuestion]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#E85A24] animate-spin" />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-500">לא נמצאו שאלות</p>
      </div>
    );
  }

  const currentAnswer = answers[currentQuestion.id];
  const isAnswered = currentAnswer !== undefined && currentAnswer !== '';
  const isRequired = currentQuestion.is_required !== false;

  const renderQuestionInput = () => {
    switch (currentQuestion.question_type) {
      case 'scale_5':
      case 'scale_7':
        const maxScale = currentQuestion.question_type === 'scale_7' ? 7 : 5;
        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-500 px-2">
              <span>{currentQuestion.scale_labels?.low || 'לא מסכים'}</span>
              <span>{currentQuestion.scale_labels?.high || 'מסכים מאוד'}</span>
            </div>
            <div className="flex justify-center gap-2 md:gap-4">
              {[...Array(maxScale)].map((_, i) => {
                const value = i + 1;
                return (
                  <motion.button
                    key={value}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleAnswer(value)}
                    className={cn(
                      "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-lg font-semibold transition-all",
                      currentAnswer === value
                        ? "bg-[#E85A24] text-white shadow-lg shadow-orange-200"
                        : "bg-white border-2 border-gray-200 text-gray-600 hover:border-[#E85A24]"
                    )}
                  >
                    {value}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );

      case 'open_text':
        return (
          <Textarea
            value={currentAnswer || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            placeholder="הקלד את תשובתך כאן..."
            className="min-h-[150px] text-lg p-4 border-2 border-gray-200 rounded-xl resize-none"
            dir="rtl"
          />
        );

      case 'single_choice':
      case 'bottom_line':
        const choices = currentQuestion.choices || [
          { value: 'yes', label: 'כן' },
          { value: 'no', label: 'לא' }
        ];
        return (
          <div className="space-y-3">
            {choices.map((choice) => (
              <motion.button
                key={choice.value}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAnswer(choice.value)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-right transition-all flex items-center gap-3",
                  currentAnswer === choice.value
                    ? "border-[#E85A24] bg-orange-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                  currentAnswer === choice.value
                    ? "bg-[#E85A24] text-white"
                    : "border-2 border-gray-300"
                )}>
                  {currentAnswer === choice.value && <Check className="w-4 h-4" />}
                </div>
                <span className={cn(
                  "font-medium",
                  currentAnswer === choice.value ? "text-[#6B2D4A]" : "text-gray-700"
                )}>
                  {choice.label}
                </span>
              </motion.button>
            ))}
          </div>
        );

      case 'multi_choice':
        const multiChoices = currentQuestion.choices || [];
        const selectedValues = currentAnswer ? currentAnswer.split(',').filter(v => v) : [];
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-2">ניתן לבחור יותר מאפשרות אחת</p>
            {multiChoices.map((choice) => {
              const isSelected = selectedValues.includes(choice.value);
              return (
                <motion.button
                  key={choice.value}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    let newSelected;
                    if (isSelected) {
                      newSelected = selectedValues.filter(v => v !== choice.value);
                    } else {
                      newSelected = [...selectedValues, choice.value];
                    }
                    handleAnswer(newSelected.join(','));
                  }}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-right transition-all flex items-center gap-3",
                    isSelected
                      ? "border-[#E85A24] bg-orange-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0",
                    isSelected
                      ? "bg-[#E85A24] text-white"
                      : "border-2 border-gray-300"
                  )}>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                  <span className={cn(
                    "font-medium",
                    isSelected ? "text-[#6B2D4A]" : "text-gray-700"
                  )}>
                    {choice.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              שאלה {currentIndex + 1} מתוך {questions.length}
            </span>
            {!isRequired && (
              <span className="text-xs text-gray-400">אופציונלי</span>
            )}
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#E85A24] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 py-8"
          >
            <h2 className="text-xl md:text-2xl font-bold text-[#6B2D4A] mb-8 text-center">
              {currentQuestion.prompt_hebrew}
            </h2>

            <div className="flex-1 flex items-center justify-center">
              <div className="w-full">
                {renderQuestionInput()}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {currentIndex > 0 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-6"
            >
              <ChevronRight className="w-5 h-5" />
              חזרה
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            disabled={isRequired && !isAnswered}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-6 bg-[#E85A24] hover:bg-[#D14A1A] text-white text-lg"
          >
            {currentIndex === questions.length - 1 ? 'סיום' : 'הבא'}
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>
        
        <p className="text-center text-xs text-gray-400 mt-2 md:hidden">
          החלק שמאלה להמשיך, ימינה לחזור
        </p>
      </div>
    </div>
  );
}