import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, MessageSquare, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const QUESTION_TYPE_LABELS = {
  scale_5: 'סולם 1-5',
  scale_7: 'סולם 1-7',
  open_text: 'פתוחה',
  single_choice: 'בחירה',
  multi_choice: 'בחירה מרובה',
  bottom_line: 'שורה תחתונה'
};

export default function SurveyAdminCard({ survey, responses, responseCount }) {
  const [expanded, setExpanded] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleExpand = async () => {
    if (!expanded && !questions) {
      setLoading(true);
      const qs = await base44.entities.SurveyQuestion.filter({ survey_id: survey.id }, 'order_index');
      setQuestions(qs);
      setLoading(false);
    }
    setExpanded(v => !v);
  };

  // Build per-question answer aggregates
  const getAnswerSummary = (question) => {
    if (!responses.length) return null;
    const answers = responses.flatMap(r => r.answers || []).filter(a => a.question_id === question.id);
    if (!answers.length) return null;

    if (question.question_type === 'scale_5' || question.question_type === 'scale_7') {
      const nums = answers.map(a => a.numeric_value).filter(Boolean);
      if (!nums.length) return null;
      const avg = (nums.reduce((s, n) => s + n, 0) / nums.length).toFixed(1);
      return { type: 'scale', avg, count: nums.length };
    }
    if (question.question_type === 'open_text') {
      const texts = answers.map(a => a.value).filter(Boolean);
      return { type: 'open', texts };
    }
    if (question.question_type === 'single_choice' || question.question_type === 'bottom_line') {
      const counts = {};
      answers.forEach(a => { if (a.value) counts[a.value] = (counts[a.value] || 0) + 1; });
      return { type: 'choice', counts, total: answers.length };
    }
    return null;
  };

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 text-right">
            <p className="font-semibold text-gray-800">{survey.title || survey.activity_description?.slice(0, 60) || 'סקר ללא כותרת'}</p>
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
              <span>נוצר: {new Date(survey.created_date).toLocaleDateString('he-IL')}</span>
              {survey.created_by && <span>| {survey.created_by}</span>}
              {survey.audience && <span>| {survey.audience}</span>}
              {survey.prompt_version && <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">{survey.prompt_version}</span>}
              <span className={`px-1.5 py-0.5 rounded ${
                survey.status === 'published' ? 'bg-green-100 text-green-700' :
                survey.status === 'candidate' ? 'bg-purple-100 text-purple-700' :
                survey.status === 'closed' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-600'
              }`}>{
                survey.status === 'candidate' ? 'לא נבחר' :
                survey.status === 'draft' ? 'טיוטה' :
                survey.status === 'published' ? 'פורסם' :
                survey.status === 'closed' ? 'סגור' : survey.status
              }</span>
              {responseCount > 0 && <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{responseCount} תגובות</span>}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Link to={createPageUrl('SurveyEditor') + `?surveyId=${survey.id}`}>
              <Button variant="outline" size="sm">פתח</Button>
            </Link>
            {responseCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleExpand} className="text-[#6B2D4A]">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {expanded ? 'סגור' : 'תגובות'}
              </Button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
            {loading && <p className="text-sm text-gray-400 text-center">טוען שאלות...</p>}
            {questions && questions.map((q, idx) => {
              const summary = getAnswerSummary(q);
              return (
                <div key={q.id} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-800 mb-2">
                    <span className="text-xs text-[#E85A24] ml-2">{idx + 1}.</span>
                    {q.prompt_hebrew}
                  </p>
                  {!summary && <p className="text-xs text-gray-400">אין תגובות לשאלה זו</p>}
                  {summary?.type === 'scale' && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-yellow-700">{summary.avg}</span>
                      <span className="text-xs text-gray-400">/ 5 · {summary.count} תגובות</span>
                    </div>
                  )}
                  {summary?.type === 'open' && (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {summary.texts.slice(0, 20).map((t, i) => (
                        <div key={i} className="text-xs bg-white border border-gray-200 rounded px-2 py-1 text-gray-700">{t}</div>
                      ))}
                      {summary.texts.length > 20 && <p className="text-xs text-gray-400">...ועוד {summary.texts.length - 20}</p>}
                    </div>
                  )}
                  {summary?.type === 'choice' && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(summary.counts).map(([val, cnt]) => (
                        <span key={val} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {val}: {cnt} ({Math.round(cnt / summary.total * 100)}%)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}