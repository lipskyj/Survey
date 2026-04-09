import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Plus, Copy, Check, Trash2,
  ExternalLink, QrCode, Loader2, Users, BarChart2
} from 'lucide-react';
import { toast } from 'sonner';

function SimpleQRCode({ value, size = 160 }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  return (
    <div className="bg-white p-3 rounded-xl inline-block">
      <img src={qrUrl} alt="QR Code" width={size} height={size} />
    </div>
  );
}

export default function FixedSurveyClassLink() {
  const queryClient = useQueryClient();
  const [surveyId, setSurveyId] = useState(null);
  const [newClassName, setNewClassName] = useState('');
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [showQRFor, setShowQRFor] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('surveyId');
    if (id) setSurveyId(id);
  }, []);

  // Get the base (template) survey
  const { data: baseSurvey } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      const s = await base44.entities.Survey.filter({ id: surveyId });
      return s[0] || null;
    },
    enabled: !!surveyId,
  });

  // Get all class copies linked to this base survey
  const { data: classSurveys = [], isLoading } = useQuery({
    queryKey: ['class-surveys', surveyId],
    queryFn: () => base44.entities.Survey.filter(
      { activity_description: `__class_of:${surveyId}` },
      '-created_date'
    ),
    enabled: !!surveyId,
  });

  // Get base questions (to duplicate for each class)
  const { data: baseQuestions = [] } = useQuery({
    queryKey: ['survey-questions', surveyId],
    queryFn: () => base44.entities.SurveyQuestion.filter({ survey_id: surveyId }, 'order_index'),
    enabled: !!surveyId,
  });

  const generateSlug = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  };

  const createClassLink = useMutation({
    mutationFn: async (className) => {
      const slug = generateSlug();
      // Create a copy of the survey for this class
      const classSurvey = await base44.entities.Survey.create({
        title: `${baseSurvey?.title} — ${className}`,
        status: 'published',
        language: baseSurvey?.language || 'hebrew',
        intro_text: baseSurvey?.intro_text || '',
        audience: baseSurvey?.audience || 'students',
        share_slug: slug,
        published_at: new Date().toISOString(),
        activity_description: `__class_of:${surveyId}`, // marks this as a class copy
        // store class name in title field for display
      });

      // Duplicate questions
      if (baseQuestions.length > 0) {
        await base44.entities.SurveyQuestion.bulkCreate(
          baseQuestions.map(q => ({
            survey_id: classSurvey.id,
            question_type: q.question_type,
            prompt_hebrew: q.prompt_hebrew,
            order_index: q.order_index,
            kit_domain: q.kit_domain,
            is_required: q.is_required,
            scale_labels: q.scale_labels,
            choices: q.choices,
            is_generated: false,
          }))
        );
      }

      return classSurvey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['class-surveys', surveyId]);
      setNewClassName('');
      toast.success('קישור כיתה נוצר בהצלחה!');
    },
    onError: () => toast.error('שגיאה ביצירת הקישור'),
  });

  const deleteClassSurvey = useMutation({
    mutationFn: async (id) => {
      const qs = await base44.entities.SurveyQuestion.filter({ survey_id: id });
      for (const q of qs) await base44.entities.SurveyQuestion.delete(q.id);
      await base44.entities.Survey.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['class-surveys', surveyId]);
      toast.success('הקישור נמחק');
    }
  });

  const getShareUrl = (slug) =>
    `${window.location.origin}${createPageUrl('RespondIntro')}?s=${slug}`;

  const copyLink = async (slug) => {
    await navigator.clipboard.writeText(getShareUrl(slug));
    setCopiedSlug(slug);
    toast.success('הקישור הועתק');
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const getClassName = (survey) => {
    const parts = survey.title?.split(' — ');
    return parts?.length > 1 ? parts[parts.length - 1] : survey.title;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to={createPageUrl('FixedSurveySetup')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ChevronRight className="w-5 h-5" />
            חזרה לעריכה
          </Link>
          <h1 className="font-bold text-lg text-[#6B2D4A]">קישורים לכיתות</h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Create new class link */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <h2 className="font-semibold text-[#6B2D4A] mb-4">יצירת קישור לכיתה חדשה</h2>
            <div className="flex gap-3">
              <Input
                placeholder="שם הכיתה (למשל: ז׳1, ח׳2...)"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newClassName.trim()) createClassLink.mutate(newClassName.trim()); }}
                className="flex-1"
                dir="rtl"
              />
              <Button
                onClick={() => { if (newClassName.trim()) createClassLink.mutate(newClassName.trim()); }}
                disabled={!newClassName.trim() || createClassLink.isPending}
                className="bg-[#E85A24] hover:bg-[#D14A1A]"
              >
                {createClassLink.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 ml-1" />צור</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing class links */}
        <div>
          <h2 className="font-semibold text-[#6B2D4A] mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            קישורים קיימים ({classSurveys.length})
          </h2>

          {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}

          {!isLoading && classSurveys.length === 0 && (
            <Card className="bg-white border-0 shadow-sm">
              <CardContent className="p-8 text-center text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>טרם נוצרו קישורים לכיתות</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <AnimatePresence>
              {classSurveys.map((cs) => (
                <motion.div
                  key={cs.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="bg-white border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-semibold text-gray-800">{getClassName(cs)}</span>
                          {cs.responses_count > 0 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {cs.responses_count} תגובות
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Link to={createPageUrl('ResultsOverview') + `?surveyId=${cs.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="תוצאות">
                              <BarChart2 className="w-4 h-4 text-[#6B2D4A]" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => setShowQRFor(showQRFor === cs.id ? null : cs.id)}
                            title="QR Code"
                          >
                            <QrCode className="w-4 h-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => window.open(getShareUrl(cs.share_slug), '_blank')}
                          >
                            <ExternalLink className="w-4 h-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => copyLink(cs.share_slug)}
                          >
                            {copiedSlug === cs.share_slug ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => { if (confirm(`למחוק את קישור הכיתה "${getClassName(cs)}"?`)) deleteClassSurvey.mutate(cs.id); }}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </div>

                      {/* URL preview */}
                      <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500 font-mono truncate" dir="ltr">
                        {getShareUrl(cs.share_slug)}
                      </div>

                      {/* QR Code */}
                      <AnimatePresence>
                        {showQRFor === cs.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 flex justify-center"
                          >
                            <SimpleQRCode value={getShareUrl(cs.share_slug)} size={160} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}