import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from 'framer-motion';
import { ChevronRight, Loader2, BarChart3, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const KIT_DOMAIN_LABELS = {
  relevance: 'רלוונטיות',
  skills: 'מיומנויות',
  delivery_quality: 'איכות העברה',
  belonging: 'שייכות',
  none: 'כללי'
};

export default function ResultsByQuestion() {
  const [surveyId, setSurveyId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSurveyId(params.get('surveyId'));
  }, []);

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['survey-questions', surveyId],
    queryFn: () => base44.entities.SurveyQuestion.filter({ survey_id: surveyId }, 'order_index'),
    enabled: !!surveyId
  });

  const { data: responses = [], isLoading: responsesLoading } = useQuery({
    queryKey: ['survey-responses', surveyId],
    queryFn: () => base44.entities.SurveyResponse.filter({ survey_id: surveyId, is_complete: true }),
    enabled: !!surveyId
  });

  const getQuestionStats = (question) => {
    const answers = responses
      .flatMap(r => r.answers || [])
      .filter(a => a.question_id === question.id);

    if (question.question_type === 'scale_5' || question.question_type === 'scale_7') {
      const numericAnswers = answers.map(a => parseInt(a.value) || a.numeric_value).filter(v => !isNaN(v));
      const avg = numericAnswers.length > 0 
        ? (numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length).toFixed(1)
        : 0;
      
      const maxScale = question.question_type === 'scale_7' ? 7 : 5;
      const distribution = [];
      for (let i = 1; i <= maxScale; i++) {
        distribution.push({
          value: i,
          count: numericAnswers.filter(v => v === i).length,
          label: String(i)
        });
      }
      
      return { type: 'scale', avg, distribution, count: numericAnswers.length, maxScale };
    }

    if (question.question_type === 'open_text') {
      const textAnswers = answers.map(a => a.value).filter(v => v && v.trim());
      return { type: 'text', answers: textAnswers, count: textAnswers.length };
    }

    if (question.question_type === 'single_choice' || question.question_type === 'bottom_line') {
      const choices = question.choices || [];
      const distribution = choices.map(c => ({
        value: c.value,
        label: c.label,
        count: answers.filter(a => a.value === c.value).length
      }));
      return { type: 'choice', distribution, count: answers.length };
    }

    return { type: 'unknown', count: answers.length };
  };

  if (questionsLoading || responsesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#E85A24] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to={createPageUrl('ResultsOverview') + `?surveyId=${surveyId}`}>
          <Button variant="ghost" size="icon">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#6B2D4A]">ניתוח לפי שאלה</h1>
          <p className="text-gray-500">{responses.length} תגובות שהושלמו</p>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {questions.map((question, index) => {
          const stats = getQuestionStats(question);
          
          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="bg-orange-100 text-[#E85A24] text-sm px-2 py-1 rounded-full font-medium">
                        {index + 1}
                      </span>
                      {question.kit_domain && question.kit_domain !== 'none' && (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                          {KIT_DOMAIN_LABELS[question.kit_domain]}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{stats.count} תשובות</span>
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-800 mt-2">
                    {question.prompt_hebrew}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.type === 'scale' && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-3xl font-bold text-[#E85A24]">{stats.avg}</span>
                        <span className="text-gray-500">מתוך {stats.maxScale}</span>
                      </div>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.distribution}>
                            <XAxis dataKey="label" />
                            <YAxis allowDecimals={false} />
                            <Tooltip 
                              formatter={(value) => [`${value} תשובות`, '']}
                              labelFormatter={(label) => `ציון ${label}`}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {stats.distribution.map((entry, i) => (
                                <Cell 
                                  key={i} 
                                  fill={entry.value >= stats.maxScale - 1 ? '#22c55e' : 
                                        entry.value <= 2 ? '#ef4444' : '#E85A24'} 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {stats.type === 'choice' && (
                    <div className="space-y-3">
                      {stats.distribution.map((item) => {
                        const percentage = stats.count > 0 ? Math.round((item.count / stats.count) * 100) : 0;
                        return (
                          <div key={item.value}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-700">{item.label}</span>
                              <span className="text-sm text-gray-500">{item.count} ({percentage}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {stats.type === 'text' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{stats.count} תשובות טקסט</span>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {stats.answers.slice(0, 10).map((answer, i) => (
                          <div key={i} className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm">
                            {answer}
                          </div>
                        ))}
                        {stats.answers.length > 10 && (
                          <p className="text-center text-sm text-gray-400 py-2">
                            ועוד {stats.answers.length - 10} תשובות...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}