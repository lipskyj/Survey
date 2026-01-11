import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import StepWrapper from '@/components/builder/StepWrapper';
import ChoiceCard from '@/components/builder/ChoiceCard';
import { toast } from 'sonner';
import { GraduationCap, Users, Briefcase, Building, Info } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from 'framer-motion';

const AUDIENCES = [
  { value: 'students', label: 'תלמידים', description: 'משוב מהתלמידים שהשתתפו', icon: GraduationCap },
  { value: 'parents', label: 'הורים', description: 'משוב מההורים', icon: Users },
  { value: 'teachers', label: 'מורים', description: 'משוב מצוות ההוראה', icon: Briefcase },
  { value: 'management', label: 'הנהלה', description: 'משוב מצוות ההנהלה', icon: Building },
];

export default function Audience() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');
  const [surveyId, setSurveyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [backgroundQuestions, setBackgroundQuestions] = useState({
    include_class: false,
    include_gender: false,
    include_subject: false,
    include_role: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('surveyId');
    if (id) {
      setSurveyId(id);
      base44.entities.Survey.filter({ id }).then(surveys => {
        if (surveys.length > 0) {
          if (surveys[0].audience) setSelected(surveys[0].audience);
          if (typeof surveys[0].is_anonymous === 'boolean') setIsAnonymous(surveys[0].is_anonymous);
          if (surveys[0].background_questions) setBackgroundQuestions(surveys[0].background_questions);
        }
      });
    }
  }, []);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      await base44.entities.Survey.update(surveyId, {
        audience: selected,
        is_anonymous: isAnonymous,
        background_questions: backgroundQuestions,
        current_step: 'A3',
        last_autosave: new Date().toISOString()
      });
      navigate(createPageUrl('GradeRange') + `?surveyId=${surveyId}`);
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
    setIsLoading(false);
  };

  const handleBack = () => {
    navigate(createPageUrl('ActivityDescription') + `?surveyId=${surveyId}`);
  };

  const handleSaveDraft = async () => {
    try {
      await base44.entities.Survey.update(surveyId, {
        audience: selected,
        is_anonymous: isAnonymous,
        background_questions: backgroundQuestions,
        last_autosave: new Date().toISOString()
      });
      toast.success('הטיוטה נשמרה');
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
  };

  const toggleBackgroundQuestion = (key) => {
    setBackgroundQuestions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Get relevant background questions based on audience
  const getBackgroundOptions = () => {
    switch (selected) {
      case 'students':
        return [
          { key: 'include_class', label: 'שאלת כיתה', description: 'מאיזו כיתה התלמיד/ה' },
          { key: 'include_gender', label: 'שאלת מגדר', description: 'מגדר התלמיד/ה' },
        ];
      case 'teachers':
        return [
          { key: 'include_subject', label: 'שאלת מקצוע', description: 'מה המקצוע שהמורה מלמד/ת' },
        ];
      case 'parents':
        return [
          { key: 'include_class', label: 'שאלת כיתה', description: 'באיזו כיתה הילד/ה' },
        ];
      case 'management':
        return [
          { key: 'include_role', label: 'שאלת תפקיד', description: 'מה התפקיד בהנהלה' },
        ];
      default:
        return [];
    }
  };

  const backgroundOptions = getBackgroundOptions();

  return (
    <StepWrapper
      currentStep={2}
      totalSteps={7}
      stepLabel="קהל היעד"
      title="ממי נאסוף את המשוב?"
      subtitle="בחר את קהל היעד המרכזי לסקר"
      onNext={handleNext}
      onBack={handleBack}
      onSaveDraft={handleSaveDraft}
      isNextDisabled={!selected}
      isLoading={isLoading}
    >
      <div className="space-y-6">
        {/* Audience Selection */}
        <div className="space-y-3">
          {AUDIENCES.map((audience) => (
            <ChoiceCard
              key={audience.value}
              value={audience.value}
              label={audience.label}
              description={audience.description}
              icon={audience.icon}
              isSelected={selected === audience.value}
              onClick={setSelected}
            />
          ))}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Anonymous vs Named Survey */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3">סוג השאלון</h4>
                <div className="space-y-3">
                  <label 
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${isAnonymous ? 'bg-[#E85A24]/10 border-2 border-[#E85A24]' : 'bg-white border border-gray-200 hover:border-gray-300'}`}
                    onClick={() => setIsAnonymous(true)}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${isAnonymous ? 'border-[#E85A24]' : 'border-gray-300'}`}>
                      {isAnonymous && <div className="w-2.5 h-2.5 rounded-full bg-[#E85A24]" />}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">שאלון אנונימי</span>
                      <p className="text-sm text-gray-500 mt-0.5">לא ניתן לזהות מי ענה - מעודד מענה כנה יותר</p>
                    </div>
                  </label>
                  
                  <label 
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${!isAnonymous ? 'bg-[#E85A24]/10 border-2 border-[#E85A24]' : 'bg-white border border-gray-200 hover:border-gray-300'}`}
                    onClick={() => setIsAnonymous(false)}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${!isAnonymous ? 'border-[#E85A24]' : 'border-gray-300'}`}>
                      {!isAnonymous && <div className="w-2.5 h-2.5 rounded-full bg-[#E85A24]" />}
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">שאלון שמי</span>
                      <p className="text-sm text-gray-500 mt-0.5">ניתן לזהות מי ענה - עלול ליצור ריצוי במענה</p>
                    </div>
                  </label>
                </div>
                
                <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 rounded-lg">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    {isAnonymous 
                      ? 'שאלון אנונימי מאפשר לעונים להרגיש חופשיים לענות בכנות, מה שמוביל לתשובות אמינות יותר.'
                      : 'שאלון שמי מאפשר מעקב אישי, אך עלול לגרום לעונים לענות מה שנראה להם "נכון" ולא מה שהם באמת חושבים.'}
                  </p>
                </div>
              </div>

              {/* Background Questions */}
              {backgroundOptions.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-1">שאלות רקע אופציונליות</h4>
                  <p className="text-sm text-gray-500 mb-4">בחר אילו שאלות רקע להוסיף לשאלון</p>
                  
                  <div className="space-y-3">
                    {backgroundOptions.map((option) => (
                      <label 
                        key={option.key}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors"
                      >
                        <Checkbox
                          checked={backgroundQuestions[option.key]}
                          onCheckedChange={() => toggleBackgroundQuestion(option.key)}
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">{option.label}</span>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StepWrapper>
  );
}