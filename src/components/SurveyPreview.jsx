import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

export default function SurveyPreview({ surveyId }) {
  const [questions, setQuestions] = useState([]);
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [surveyData] = await base44.entities.Survey.filter({ id: surveyId });
      const questionsData = await base44.entities.SurveyQuestion.filter(
        { survey_id: surveyId },
        'order_index'
      );
      setSurvey(surveyData);
      setQuestions(questionsData);
      setLoading(false);
    };
    loadData();
  }, [surveyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#E85A24]" />
      </div>
    );
  }

  const questionTypeLabels = {
    scale_5: 'סולם 5 דרגות',
    scale_7: 'סולם 7 דרגות',
    open_text: 'טקסט פתוח',
    single_choice: 'בחירה יחידה',
    multi_choice: 'בחירה מרובה',
    bottom_line: 'שאלת סיכום'
  };

  const domainLabels = {
    relevance: 'רלוונטיות',
    skills: 'מיומנויות',
    delivery_quality: 'איכות הנחיה',
    belonging: 'שייכות',
    none: '-'
  };

  return (
    <div className="space-y-4">
      {survey?.intro_text && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">פתיחה</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{survey.intro_text}</p>
          </CardContent>
        </Card>
      )}

      {questions.map((q, idx) => (
        <Card key={q.id} className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-gray-400">שאלה {idx + 1}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {questionTypeLabels[q.question_type]}
                  </span>
                  {q.kit_domain && q.kit_domain !== 'none' && (
                    <span className="text-xs bg-[#E85A24]/10 text-[#E85A24] px-2 py-0.5 rounded">
                      {domainLabels[q.kit_domain]}
                    </span>
                  )}
                </div>
                <CardTitle className="text-base font-medium text-gray-800">
                  {q.prompt_hebrew}
                  {q.is_required && <span className="text-red-500 mr-1">*</span>}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          
          {(q.question_type === 'scale_5' || q.question_type === 'scale_7') && (
            <CardContent className="pt-0">
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="text-xs text-gray-600">{q.scale_labels?.low || '1'}</span>
                <div className="flex gap-2">
                  {[...Array(q.question_type === 'scale_5' ? 5 : 7)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-sm text-gray-500">
                      {i + 1}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-600">{q.scale_labels?.high || (q.question_type === 'scale_5' ? '5' : '7')}</span>
              </div>
            </CardContent>
          )}

          {(q.question_type === 'single_choice' || q.question_type === 'multi_choice' || q.question_type === 'bottom_line') && q.choices && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {q.choices.map((choice, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <div className={`w-4 h-4 border-2 border-gray-300 ${q.question_type === 'single_choice' || q.question_type === 'bottom_line' ? 'rounded-full' : 'rounded'}`} />
                    <span className="text-sm text-gray-700">{choice.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          )}

          {q.question_type === 'open_text' && (
            <CardContent className="pt-0">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 min-h-[60px] text-sm text-gray-400">
                תשובה חופשית...
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      <p className="text-center text-sm text-gray-500 pt-4">
        סה״כ {questions.length} שאלות
      </p>
    </div>
  );
}