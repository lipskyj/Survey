import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { motion } from 'framer-motion';
import { ChevronRight, Loader2, Download, FileSpreadsheet, FileText, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ExportData() {
  const [surveyId, setSurveyId] = useState(null);
  const [anonymize, setAnonymize] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['survey-responses', surveyId],
    queryFn: () => base44.entities.SurveyResponse.filter({ survey_id: surveyId, is_complete: true }),
    enabled: !!surveyId
  });

  const exportToCSV = () => {
    if (responses.length === 0) {
      toast.error('אין נתונים לייצוא');
      return;
    }

    setIsExporting(true);

    try {
      // Create headers
      const headers = ['תאריך מילוי'];
      if (!anonymize) {
        headers.push('מזהה סשן');
      }
      questions.forEach((q, i) => {
        headers.push(`שאלה ${i + 1}`);
      });

      // Create rows
      const rows = responses.map(response => {
        const row = [format(new Date(response.created_date), 'dd/MM/yyyy HH:mm')];
        
        if (!anonymize) {
          row.push(response.session_id || '');
        }

        questions.forEach(q => {
          const answer = response.answers?.find(a => a.question_id === q.id);
          row.push(answer?.value || '');
        });

        return row;
      });

      // Convert to CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      // Add BOM for Hebrew support
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Download
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `survey_export_${format(new Date(), 'yyyyMMdd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('הקובץ הורד בהצלחה');
    } catch (error) {
      toast.error('שגיאה בייצוא');
    }

    setIsExporting(false);
  };

  const exportSummary = () => {
    if (responses.length === 0) {
      toast.error('אין נתונים לייצוא');
      return;
    }

    setIsExporting(true);

    try {
      let summaryText = `סיכום סקר: ${survey?.title || survey?.activity_description || 'סקר'}\n`;
      summaryText += `תאריך ייצוא: ${format(new Date(), 'dd/MM/yyyy')}\n`;
      summaryText += `מספר משיבים: ${responses.length}\n\n`;
      summaryText += `${'='.repeat(50)}\n\n`;

      questions.forEach((q, i) => {
        summaryText += `שאלה ${i + 1}: ${q.prompt_hebrew}\n`;
        
        const answers = responses
          .flatMap(r => r.answers || [])
          .filter(a => a.question_id === q.id);

        if (q.question_type === 'scale_5' || q.question_type === 'scale_7') {
          const numericAnswers = answers.map(a => parseInt(a.value) || a.numeric_value).filter(v => !isNaN(v));
          const avg = numericAnswers.length > 0 
            ? (numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length).toFixed(2)
            : 'N/A';
          summaryText += `ממוצע: ${avg}\n`;
          summaryText += `מספר תשובות: ${numericAnswers.length}\n`;
        } else if (q.question_type === 'open_text') {
          const textAnswers = answers.map(a => a.value).filter(v => v && v.trim());
          summaryText += `מספר תשובות: ${textAnswers.length}\n`;
          if (textAnswers.length > 0) {
            summaryText += `תשובות:\n`;
            textAnswers.slice(0, 10).forEach((a, idx) => {
              summaryText += `  ${idx + 1}. ${a}\n`;
            });
            if (textAnswers.length > 10) {
              summaryText += `  ... ועוד ${textAnswers.length - 10} תשובות\n`;
            }
          }
        } else {
          summaryText += `מספר תשובות: ${answers.length}\n`;
        }
        
        summaryText += `\n${'-'.repeat(30)}\n\n`;
      });

      const bom = '\uFEFF';
      const blob = new Blob([bom + summaryText], { type: 'text/plain;charset=utf-8;' });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `survey_summary_${format(new Date(), 'yyyyMMdd')}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('הסיכום הורד בהצלחה');
    } catch (error) {
      toast.error('שגיאה בייצוא');
    }

    setIsExporting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#E85A24] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to={createPageUrl('ResultsOverview') + `?surveyId=${surveyId}`}>
          <Button variant="ghost" size="icon">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#6B2D4A]">ייצוא נתונים</h1>
          <p className="text-gray-500">{responses.length} תגובות להורדה</p>
        </div>
      </div>

      {/* Privacy Setting */}
      <Card className="bg-white border-0 shadow-sm mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <Label className="text-gray-800 font-medium">ייצוא אנונימי</Label>
                <p className="text-sm text-gray-500">הסר מזהים אישיים מהנתונים</p>
              </div>
            </div>
            <Switch
              checked={anonymize}
              onCheckedChange={setAnonymize}
            />
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card 
            className="bg-white border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
            onClick={exportToCSV}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet className="w-7 h-7 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">ייצוא ל-CSV</h3>
                  <p className="text-sm text-gray-500">
                    קובץ טבלה שניתן לפתוח ב-Excel או Google Sheets
                  </p>
                </div>
                <Button
                  disabled={isExporting || responses.length === 0}
                  className="bg-[#E85A24] hover:bg-[#D14A1A] text-white"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 ml-2" />
                      הורד
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card 
            className="bg-white border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
            onClick={exportSummary}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-7 h-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">סיכום טקסטואלי</h3>
                  <p className="text-sm text-gray-500">
                    דוח סיכום עם ממוצעים ותשובות נבחרות
                  </p>
                </div>
                <Button
                  variant="outline"
                  disabled={isExporting || responses.length === 0}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 ml-2" />
                      הורד
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* No Data */}
      {responses.length === 0 && (
        <Card className="bg-amber-50 border-amber-200 mt-6">
          <CardContent className="p-4 text-center">
            <p className="text-amber-800">אין תגובות לייצוא עדיין</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}