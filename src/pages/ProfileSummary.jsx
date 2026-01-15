import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Edit2, FileText, Users, School, 
  Calendar, Target, Sparkles, CheckCircle 
} from 'lucide-react';
import { toast } from 'sonner';

const LABELS = {
  audience: {
    students: 'תלמידים',
    parents: 'הורים',
    teachers: 'מורים',
    management: 'הנהלה'
  },
  event_type: {
    single_event: 'אירוע חד פעמי',
    ongoing_program: 'תוכנית מתמשכת',
    annual_activity: 'פעילות שנתית קבועה',
    special_project: 'פרויקט מיוחד'
  },
  content_focus: {
    pedagogical: 'לימודי-פדגוגי',
    social_emotional: 'חברתי-רגשי',
    values: 'ערכי',
    organizational: 'ארגוני-לוגיסטי',
    community: 'קהילתי'
  },
  evaluation_goal: {
    improve_activity: 'שיפור הפעילות',
    measure_impact: 'מדידת השפעה',
    stakeholder_feedback: 'שיתוף בעלי עניין',
    compliance: 'עמידה בדרישות'
  }
};

export default function ProfileSummary() {
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [surveyId, setSurveyId] = useState(null);

  useEffect(() => {
    const loadSurvey = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('surveyId');
      if (id) {
        setSurveyId(id);
        const surveys = await base44.entities.Survey.filter({ id });
        if (surveys.length > 0) {
          setSurvey(surveys[0]);
        }
      }
    };
    loadSurvey();
  }, []);

  const getGradeLabel = () => {
    if (!survey?.grade_range?.selected_grades?.length) return 'לא נבחר';
    const gradeLabels = {
      middle: 'חטיבת ביניים',
      high: 'תיכון',
      college: 'מכללה'
    };
    return survey.grade_range.selected_grades.map(g => gradeLabels[g] || g).join(', ');
  };

  const getMeasurementTargets = () => {
    if (!survey?.measurement_targets) return null;
    const { selected_values, selected_knowledge, selected_skills } = survey.measurement_targets;
    const all = [
      ...(selected_values || []),
      ...(selected_knowledge || []),
      ...(selected_skills || [])
    ];
    return all.length > 0 ? all.join(', ') : null;
  };

  const getBackgroundQuestions = () => {
    if (!survey?.background_questions) return null;
    const bg = survey.background_questions;
    const selected = [];
    if (bg.include_class) selected.push('כיתה');
    if (bg.include_gender) selected.push('מגדר');
    if (bg.include_subject) selected.push('מקצוע');
    if (bg.include_role) selected.push('תפקיד');
    return selected.length > 0 ? selected.join(', ') : null;
  };

  const summaryItems = survey ? [
    { 
      icon: FileText, 
      label: 'תיאור הפעילות', 
      value: survey.activity_description || 'לא צוין',
      step: 'ActivityDescription'
    },
    { 
      icon: Users, 
      label: 'קהל יעד', 
      value: LABELS.audience[survey.audience] || 'לא נבחר',
      step: 'Audience'
    },
    { 
      icon: School, 
      label: 'שכבות גיל', 
      value: getGradeLabel(),
      step: 'GradeRange'
    },
    { 
      icon: Calendar, 
      label: 'סוג הפעילות', 
      value: LABELS.event_type[survey.event_type] || 'לא נבחר',
      step: 'EventType'
    },
    { 
      icon: Target, 
      label: 'תחומי מיקוד', 
      value: survey.content_focus?.map(cf => LABELS.content_focus[cf]).join(', ') || 'לא נבחרו',
      step: 'ContentFocus'
    },
    ...(getMeasurementTargets() ? [{
      icon: CheckCircle,
      label: 'ערכים/ידע/מיומנויות למדידה',
      value: getMeasurementTargets(),
      step: 'MeasurementTargets'
    }] : []),
    { 
      icon: Sparkles, 
      label: 'מטרת ההערכה', 
      value: Array.isArray(survey.evaluation_goal) 
        ? survey.evaluation_goal.map(g => LABELS.evaluation_goal[g]).filter(Boolean).join(', ') || 'לא נבחר'
        : LABELS.evaluation_goal[survey.evaluation_goal] || 'לא נבחר',
      step: 'EvaluationGoal'
    },
    { 
      icon: CheckCircle, 
      label: 'הגדרת הצלחה', 
      value: survey.success_definition?.type === 'custom' 
        ? survey.success_definition.custom_text?.slice(0, 50) + '...'
        : survey.success_definition?.selected_ideas?.join(', ')?.slice(0, 50) + '...' || 'לא הוגדר',
      step: 'SuccessDefinition'
    },
    ...(getBackgroundQuestions() ? [{
      icon: Users,
      label: 'שאלות רקע',
      value: getBackgroundQuestions(),
      step: 'BackgroundQuestions'
    }] : []),
  ] : [];

  const handleContinue = async () => {
    // Check if there are multiple active prompts
    const activePrompts = await base44.entities.AdminPrompt.filter({ is_active: true });
    
    if (activePrompts.length > 1) {
      // Multiple prompts - go to multi-generation page
      navigate(createPageUrl('GenerateSurveyMultiple') + `?surveyId=${surveyId}`);
    } else {
      // Single or no active prompts - go to regular generation
      navigate(createPageUrl('GenerateSurvey') + `?surveyId=${surveyId}`);
    }
  };

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#E85A24] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#6B2D4A] mb-2">
            מעולה! סיימת להגדיר את הפעילות
          </h1>
          <p className="text-gray-500">
            בדוק את הפרטים לפני יצירת הסקר
          </p>
        </div>

        {/* Summary Cards */}
        <div className="space-y-3 mb-8">
          {summaryItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-[#E85A24]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500">{item.label}</p>
                        <p className="font-medium text-gray-800 truncate">{item.value}</p>
                      </div>
                    </div>
                    <Link 
                      to={createPageUrl(item.step) + `?surveyId=${surveyId}&returnTo=ProfileSummary`}
                      className="text-[#E85A24] hover:bg-orange-50 p-2 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          className="w-full py-6 bg-[#E85A24] hover:bg-[#D14A1A] text-white text-lg font-medium rounded-xl shadow-lg shadow-orange-200"
        >
          המשך ליצירת הסקר
          <ChevronLeft className="w-5 h-5 mr-2" />
        </Button>
      </div>
    </div>
  );
}