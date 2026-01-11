import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import StepWrapper from '@/components/builder/StepWrapper';
import { toast } from 'sonner';
import { Upload, FileText, X, Loader2 } from 'lucide-react';

export default function ActivityDescription() {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [surveyId, setSurveyId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Check for existing draft on mount
  useEffect(() => {
    const checkDraft = async () => {
      const params = new URLSearchParams(window.location.search);
      const existingId = params.get('surveyId');
      
      if (existingId) {
        const survey = await base44.entities.Survey.filter({ id: existingId });
        if (survey.length > 0) {
          setDescription(survey[0].activity_description || '');
          setFileUrl(survey[0].activity_file_url || null);
          if (survey[0].activity_file_url) {
            const urlParts = survey[0].activity_file_url.split('/');
            setFileName(decodeURIComponent(urlParts[urlParts.length - 1]) || 'קובץ מצורף');
          }
          setSurveyId(existingId);
          toast.success('הטיוטה שוחזרה בהצלחה');
        }
      }
    };
    checkDraft();
  }, []);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      let id = surveyId;
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('returnTo');
      
      if (!surveyId) {
        const newSurvey = await base44.entities.Survey.create({
          activity_description: description,
          activity_file_url: fileUrl,
          status: 'draft',
          current_step: 'A2',
          last_autosave: new Date().toISOString()
        });
        id = newSurvey.id;
      } else {
        await base44.entities.Survey.update(surveyId, {
          activity_description: description,
          activity_file_url: fileUrl,
          current_step: 'A2',
          last_autosave: new Date().toISOString()
        });
      }
      
      if (returnTo) {
        navigate(createPageUrl(returnTo) + `?surveyId=${id}`);
      } else {
        navigate(createPageUrl('Audience') + `?surveyId=${id}`);
      }
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
    setIsLoading(false);
  };

  const handleSaveDraft = async () => {
    setIsLoading(true);
    try {
      if (surveyId) {
        await base44.entities.Survey.update(surveyId, {
          activity_description: description,
          activity_file_url: fileUrl,
          last_autosave: new Date().toISOString()
        });
      } else {
        const newSurvey = await base44.entities.Survey.create({
          activity_description: description,
          activity_file_url: fileUrl,
          status: 'draft',
          current_step: 'A1',
          last_autosave: new Date().toISOString()
        });
        setSurveyId(newSurvey.id);
        window.history.replaceState({}, '', createPageUrl('ActivityDescription') + `?surveyId=${newSurvey.id}`);
      }
      toast.success('הטיוטה נשמרה');
    } catch (error) {
      toast.error('שגיאה בשמירה');
    }
    setIsLoading(false);
  };

  return (
    <StepWrapper
      currentStep={1}
      totalSteps={7}
      stepLabel="תיאור הפעילות"
      title="מה הפעילות שתרצה לקבל עליה משוב?"
      subtitle="תאר בקצרה את הפעילות, התוכנית או האירוע"
      onNext={handleNext}
      onSaveDraft={handleSaveDraft}
      isNextDisabled={!description.trim()}
      isLoading={isLoading}
      showBack={false}
    >
      <div className="space-y-6">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="לדוגמה: תוכנית העשרה לכיתות ז׳ בנושא מנהיגות, הכוללת 6 מפגשים עם מנחה חיצוני..."
          className="min-h-[180px] text-lg p-4 border-2 border-gray-200 rounded-xl focus:border-[#E85A24] focus:ring-[#E85A24] resize-none"
          dir="rtl"
        />
        
        {/* File Upload Section */}
        <div className="bg-gray-50 rounded-xl p-5 border-2 border-dashed border-gray-200">
          <div className="flex items-start gap-3 mb-3">
            <FileText className="w-5 h-5 text-[#E85A24] mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-800">העלאת קובץ עם מידע נוסף</h4>
              <p className="text-sm text-gray-500 mt-1">
                ניתן להעלות קובץ עם פרטים על הפעילות - מטרות, יעדים, גילאים וכו׳. המידע ישמש ליצירת שאלון מדויק יותר.
              </p>
            </div>
          </div>
          
          {fileUrl ? (
            <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#E85A24]" />
                <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{fileName}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFileUrl(null);
                  setFileName('');
                }}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  setIsUploading(true);
                  try {
                    const result = await base44.integrations.Core.UploadFile({ file });
                    setFileUrl(result.file_url);
                    setFileName(file.name);
                    toast.success('הקובץ הועלה בהצלחה');
                  } catch (error) {
                    toast.error('שגיאה בהעלאת הקובץ');
                  }
                  setIsUploading(false);
                }}
              />
              <div className="flex items-center justify-center gap-2 py-3 px-4 bg-white rounded-lg border border-gray-200 hover:border-[#E85A24] transition-colors">
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 text-[#E85A24] animate-spin" />
                    <span className="text-sm text-gray-600">מעלה קובץ...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-[#E85A24]" />
                    <span className="text-sm text-gray-600">בחר קובץ (PDF, DOCX, TXT)</span>
                  </>
                )}
              </div>
            </label>
          )}
        </div>
        
        <p className="text-sm text-gray-400">
          ככל שהתיאור מפורט יותר, הסקר יהיה מדויק יותר
        </p>
      </div>
    </StepWrapper>
  );
}