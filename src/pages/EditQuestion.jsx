import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const QUESTION_TYPES = [
  { value: 'scale_5', label: 'סולם 1-5' },
  { value: 'scale_7', label: 'סולם 1-7' },
  { value: 'open_text', label: 'שאלה פתוחה' },
  { value: 'single_choice', label: 'בחירה יחידה' },
  { value: 'bottom_line', label: 'שורה תחתונה' },
];

const KIT_DOMAINS = [
  { value: 'relevance', label: 'רלוונטיות' },
  { value: 'skills', label: 'מיומנויות' },
  { value: 'delivery_quality', label: 'איכות העברה' },
  { value: 'belonging', label: 'שייכות' },
  { value: 'none', label: 'ללא' },
];

export default function EditQuestion() {
  const navigate = useNavigate();
  const [surveyId, setSurveyId] = useState(null);
  const [questionId, setQuestionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    prompt_hebrew: '',
    question_type: 'scale_5',
    kit_domain: 'relevance',
    is_required: true,
    scale_labels: { low: 'לא מסכים כלל', high: 'מסכים לחלוטין' }
  });

  useEffect(() => {
    const loadQuestion = async () => {
      const params = new URLSearchParams(window.location.search);
      const sId = params.get('surveyId');
      const qId = params.get('questionId');
      
      setSurveyId(sId);
      setQuestionId(qId);
      
      if (qId) {
        const questions = await base44.entities.SurveyQuestion.filter({ id: qId });
        if (questions.length > 0) {
          setFormData({
            prompt_hebrew: questions[0].prompt_hebrew || '',
            question_type: questions[0].question_type || 'scale_5',
            kit_domain: questions[0].kit_domain || 'relevance',
            is_required: questions[0].is_required !== false,
            scale_labels: questions[0].scale_labels || { low: 'לא מסכים כלל', high: 'מסכים לחלוטין' }
          });
        }
      }
      setIsLoading(false);
    };
    loadQuestion();
  }, []);

  const handleSave = async () => {
    if (!formData.prompt_hebrew.trim()) {
      toast.error('יש להזין את נוסח השאלה');
      return;
    }

    setIsSaving(true);
    try {
      await base44.entities.SurveyQuestion.update(questionId, formData);
      toast.success('השאלה נשמרה');
      navigate(createPageUrl('SurveyEditor') + `?surveyId=${surveyId}`);
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#E85A24] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            to={createPageUrl('SurveyEditor') + `?surveyId=${surveyId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ChevronRight className="w-5 h-5" />
            חזרה
          </Link>
          <h1 className="font-bold text-lg text-[#6B2D4A]">עריכת שאלה</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Question Text */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label className="text-gray-700">נוסח השאלה</Label>
              <Textarea
                value={formData.prompt_hebrew}
                onChange={(e) => setFormData({ ...formData, prompt_hebrew: e.target.value })}
                placeholder="הקלד את נוסח השאלה..."
                className="mt-2 min-h-[100px] resize-none"
                dir="rtl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Question Settings */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6 space-y-6">
            <div>
              <Label className="text-gray-700">סוג השאלה</Label>
              <Select
                value={formData.question_type}
                onValueChange={(value) => setFormData({ ...formData, question_type: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(formData.question_type === 'scale_5' || formData.question_type === 'scale_7') && (
              <div className="space-y-3">
                <Label className="text-gray-700">תוויות הסולם</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">ערך נמוך (1)</Label>
                    <Input
                      value={formData.scale_labels?.low || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        scale_labels: { ...formData.scale_labels, low: e.target.value }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">ערך גבוה ({formData.question_type === 'scale_7' ? '7' : '5'})</Label>
                    <Input
                      value={formData.scale_labels?.high || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        scale_labels: { ...formData.scale_labels, high: e.target.value }
                      })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}


          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-6 bg-[#E85A24] hover:bg-[#D14A1A] text-white text-lg font-medium rounded-xl"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5 ml-2" />
              שמור שינויים
            </>
          )}
        </Button>
      </div>
    </div>
  );
}