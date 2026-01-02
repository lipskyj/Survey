import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';
import { 
  ChevronRight, Loader2, Sparkles, TrendingUp, 
  TrendingDown, AlertCircle, CheckCircle, Lightbulb, RefreshCw
} from 'lucide-react';

export default function AIInsights() {
  const [surveyId, setSurveyId] = useState(null);
  const [insights, setInsights] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSurveyId(params.get('surveyId'));
  }, []);

  const { data: survey } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      const surveys = await base44.entities.Survey.filter({ id: surveyId });
      return surveys[0] || null;
    },
    enabled: !!surveyId
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['survey-questions', surveyId],
    queryFn: () => base44.entities.SurveyQuestion.filter({ survey_id: surveyId }, 'order_index'),
    enabled: !!surveyId
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['survey-responses', surveyId],
    queryFn: () => base44.entities.SurveyResponse.filter({ survey_id: surveyId, is_complete: true }),
    enabled: !!surveyId
  });

  const generateInsights = async () => {
    if (responses.length === 0) return;
    
    setIsGenerating(true);
    
    try {
      // Prepare data summary
      const questionsSummary = questions.map(q => {
        const answers = responses
          .flatMap(r => r.answers || [])
          .filter(a => a.question_id === q.id);
        
        if (q.question_type === 'scale_5' || q.question_type === 'scale_7') {
          const numericAnswers = answers.map(a => parseInt(a.value) || a.numeric_value).filter(v => !isNaN(v));
          const avg = numericAnswers.length > 0 
            ? (numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length).toFixed(1)
            : null;
          return { question: q.prompt_hebrew, type: 'scale', average: avg, n: numericAnswers.length };
        }
        
        if (q.question_type === 'open_text') {
          const textAnswers = answers.map(a => a.value).filter(v => v && v.trim()).slice(0, 20);
          return { question: q.prompt_hebrew, type: 'text', answers: textAnswers };
        }
        
        return { question: q.prompt_hebrew, type: q.question_type, n: answers.length };
      });

      const prompt = `אתה מומחה בניתוח סקרי משוב חינוכיים. נתח את תוצאות הסקר הבאות וצור 5-7 תובנות עיקריות.

פרטי הסקר:
- תיאור הפעילות: ${survey?.activity_description || 'לא צוין'}
- קהל יעד: ${survey?.audience || 'לא צוין'}
- מספר משיבים: ${responses.length}

תוצאות:
${JSON.stringify(questionsSummary, null, 2)}

עבור כל תובנה, ציין:
1. כותרת קצרה (עד 10 מילים)
2. תיאור מפורט (2-3 משפטים)
3. סוג: positive/negative/neutral
4. רמת ודאות: high/medium/low (בהתבסס על גודל המדגם)
5. המלצה לפעולה (משפט אחד)

החזר JSON עם מערך תובנות.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string" },
                  confidence: { type: "string" },
                  recommendation: { type: "string" }
                }
              }
            }
          }
        }
      });

      setInsights(response.insights || []);
      setHasGenerated(true);
    } catch (error) {
      console.error('Error generating insights:', error);
    }
    
    setIsGenerating(false);
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-amber-500" />;
    }
  };

  const getConfidenceBadge = (confidence) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-100 text-green-700 border-0">ודאות גבוהה</Badge>;
      case 'medium':
        return <Badge className="bg-amber-100 text-amber-700 border-0">ודאות בינונית</Badge>;
      case 'low':
        return <Badge className="bg-gray-100 text-gray-700 border-0">ודאות נמוכה</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to={createPageUrl('ResultsOverview') + `?surveyId=${surveyId}`}>
          <Button variant="ghost" size="icon">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#6B2D4A]">תובנות AI</h1>
          <p className="text-gray-500">ניתוח חכם של תוצאות הסקר</p>
        </div>
        {hasGenerated && (
          <Button
            variant="outline"
            onClick={generateInsights}
            disabled={isGenerating}
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${isGenerating ? 'animate-spin' : ''}`} />
            נתח שוב
          </Button>
        )}
      </div>

      {/* Low N Warning */}
      {responses.length < 10 && responses.length > 0 && (
        <Card className="bg-amber-50 border-amber-200 mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">מספר תגובות נמוך ({responses.length})</p>
              <p className="text-sm text-amber-700">
                התובנות עשויות להיות פחות מדויקות עקב גודל המדגם הקטן. רמת הוודאות תהיה נמוכה.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      {!hasGenerated && responses.length > 0 && (
        <Card className="bg-white border-0 shadow-sm mb-8">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">נתח את התוצאות עם AI</h2>
            <p className="text-gray-500 mb-6">
              המערכת תנתח את כל התגובות ותפיק תובנות משמעותיות
            </p>
            <Button
              onClick={generateInsights}
              disabled={isGenerating}
              className="bg-[#E85A24] hover:bg-[#D14A1A] text-white px-8 py-6 text-lg"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 ml-2" />
                  צור תובנות
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Responses */}
      {responses.length === 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">אין תגובות לניתוח</h3>
            <p className="text-gray-500">יש לאסוף תגובות לפני יצירת תובנות</p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isGenerating && (
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-12 h-12 text-[#E85A24] animate-spin mx-auto mb-4" />
            <p className="text-gray-600">מנתח את התוצאות...</p>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {hasGenerated && insights.length > 0 && !isGenerating && (
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      insight.type === 'positive' ? 'bg-green-100' :
                      insight.type === 'negative' ? 'bg-red-100' : 'bg-amber-100'
                    }`}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800">{insight.title}</h3>
                        {getConfidenceBadge(insight.confidence)}
                      </div>
                      <p className="text-gray-600 mb-4">{insight.description}</p>
                      {insight.recommendation && (
                        <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-blue-800">{insight.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}