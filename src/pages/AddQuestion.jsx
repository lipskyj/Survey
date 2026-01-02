import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Plus, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ChoiceCard from '@/components/builder/ChoiceCard';

const QUESTION_TYPES = [
  { value: 'scale_5', label: 'סולם 1-5', description: 'שאלת הסכמה בסולם' },
  { value: 'open_text', label: 'שאלה פתוחה', description: 'תשובה חופשית בטקסט' },
  { value: 'single_choice', label: 'בחירה יחידה', description: 'בחירה מרשימת אפשרויות' },
];

const KIT_DOMAINS = [
  { value: 'relevance', label: 'רלוונטיות', description: 'עד כמה התוכן רלוונטי למשתתפים' },
  { value: 'skills', label: 'מיומנויות', description: 'רכישת מיומנויות וידע' },
  { value: 'delivery_quality', label: 'איכות העברה', description: 'איכות ההנחיה והעברת התוכן' },
  { value: 'belonging', label: 'שייכות', description: 'תחושת שייכות וחיבור' },
  { value: 'none', label: 'כללי', description: 'שאלה ללא תחום KIT ספציפי' },
];

export default function AddQuestion() {
  const navigate = useNavigate();
  const [surveyId, setSurveyId] = useState(null);
  const [step, setStep] = useState(1); // 1: type, 2: domain, 3: text
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    question_type: '',
    kit_domain: '',
    prompt_hebrew: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSurveyId(params.get('surveyId'));
  }, []);

  const generateSuggestion = async () => {
    setIsGenerating(true);
    try {
      const surveys = await base44.entities.Survey.filter({ id: surveyId });
      const survey = surveys[0];
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `צור שאלת סקר אחת בעברית.
סוג השאלה: ${formData.question_type === 'scale_5' ? 'שאלת הסכמה בסולם 1-5' : formData.question_type === 'open_text' ? 'שאלה פתוחה' : 'שאלת בחירה'}
תחום: ${formData.kit_domain}
הקשר הפעילות: ${survey?.activity_description || 'פעילות חינוכית'}
קהל יעד: ${survey?.audience || 'תלמידים'}

החזר משפט קצר וברור שמתאים לסקר.`,
        response_json_schema: {
          type: "object",
          properties: {
            question: { type: "string" }
          }
        }
      });
      
      setFormData({ ...formData, prompt_hebrew: response.question });
    } catch (error) {
      toast.error('שגיאה ביצירת הצעה');
    }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    if (!formData.prompt_hebrew.trim()) {
      toast.error('יש להזין את נוסח השאלה');
      return;
    }

    setIsLoading(true);
    try {
      const existingQuestions = await base44.entities.SurveyQuestion.filter({ survey_id: surveyId });
      const maxOrder = Math.max(...existingQuestions.map(q => q.order_index || 0), -1);

      await base44.entities.SurveyQuestion.create({
        survey_id: surveyId,
        order_index: maxOrder + 1,
        question_type: formData.question_type,
        kit_domain: formData.kit_domain,
        prompt_hebrew: formData.prompt_hebrew,
        is_required: true,
        scale_labels: formData.question_type.includes('scale') 
          ? { low: 'לא מסכים כלל', high: 'מסכים לחלוטין' }
          : undefined,
        is_generated: false
      });
      
      toast.success('השאלה נוספה');
      navigate(createPageUrl('SurveyEditor') + `?surveyId=${surveyId}`);
    } catch (error) {
      toast.error('שגיאה בהוספת השאלה');
    }
    setIsLoading(false);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-xl font-bold text-[#6B2D4A] mb-2">בחר סוג שאלה</h2>
            <p className="text-gray-500 mb-6">מה סוג התשובה שתרצה לקבל?</p>
            
            <div className="space-y-3">
              {QUESTION_TYPES.map((type) => (
                <ChoiceCard
                  key={type.value}
                  value={type.value}
                  label={type.label}
                  description={type.description}
                  isSelected={formData.question_type === type.value}
                  onClick={(v) => {
                    setFormData({ ...formData, question_type: v });
                    setStep(2);
                  }}
                />
              ))}
            </div>
          </motion.div>
        );
      
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-xl font-bold text-[#6B2D4A] mb-2">בחר תחום מדידה (KIT)</h2>
            <p className="text-gray-500 mb-6">לאיזה תחום מתייחסת השאלה?</p>
            
            <div className="space-y-3">
              {KIT_DOMAINS.map((domain) => (
                <ChoiceCard
                  key={domain.value}
                  value={domain.value}
                  label={domain.label}
                  description={domain.description}
                  isSelected={formData.kit_domain === domain.value}
                  onClick={(v) => {
                    setFormData({ ...formData, kit_domain: v });
                    setStep(3);
                  }}
                />
              ))}
            </div>
          </motion.div>
        );
      
      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-xl font-bold text-[#6B2D4A] mb-2">נוסח השאלה</h2>
            <p className="text-gray-500 mb-6">כתוב את השאלה או צור הצעה אוטומטית</p>
            
            <Card className="bg-white border-0 shadow-sm mb-4">
              <CardContent className="p-4">
                <Textarea
                  value={formData.prompt_hebrew}
                  onChange={(e) => setFormData({ ...formData, prompt_hebrew: e.target.value })}
                  placeholder="הקלד את נוסח השאלה..."
                  className="min-h-[120px] resize-none border-0 focus-visible:ring-0 p-0"
                  dir="rtl"
                />
              </CardContent>
            </Card>
            
            <Button
              variant="outline"
              onClick={generateSuggestion}
              disabled={isGenerating}
              className="w-full mb-4"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  צור ניסוח אוטומטי
                </>
              )}
            </Button>

            <Button
              onClick={handleSave}
              disabled={!formData.prompt_hebrew.trim() || isLoading}
              className="w-full py-6 bg-[#E85A24] hover:bg-[#D14A1A] text-white text-lg"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5 ml-2" />
                  הוסף שאלה
                </>
              )}
            </Button>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ChevronRight className="w-5 h-5" />
              חזרה
            </button>
          ) : (
            <Link 
              to={createPageUrl('SurveyEditor') + `?surveyId=${surveyId}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ChevronRight className="w-5 h-5" />
              ביטול
            </Link>
          )}
          <h1 className="font-bold text-lg text-[#6B2D4A]">הוספת שאלה</h1>
          <div className="w-16" />
        </div>
        
        {/* Progress */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-[#E85A24]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">שלב {step} מתוך 3</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {renderStep()}
      </div>
    </div>
  );
}