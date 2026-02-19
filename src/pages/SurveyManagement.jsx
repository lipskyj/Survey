import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';
import { 
  Plus, FileText, MoreVertical, Copy, ExternalLink, 
  BarChart3, XCircle, Loader2, Trash2, Share2 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function SurveyManagement() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get('filter'); // 'draft', 'published', or null for all

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  const { data: allSurveys = [], isLoading } = useQuery({
    queryKey: ['surveys', currentUser?.email],
    queryFn: () => base44.entities.Survey.filter({ created_by: currentUser.email, status: { $in: ['draft', 'published', 'closed', 'candidate'] } }, '-created_date'),
    enabled: !!currentUser,
  });

  const surveys = filterParam
    ? allSurveys.filter(s => s.status === filterParam)
    : allSurveys.filter(s => s.status !== 'candidate');

  const closeSurveyMutation = useMutation({
    mutationFn: (surveyId) => base44.entities.Survey.update(surveyId, { 
      status: 'closed',
      closed_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['surveys']);
      toast.success('הסקר נסגר');
    }
  });

  const deleteSurveyMutation = useMutation({
    mutationFn: async (surveyId) => {
      // Delete questions first
      const questions = await base44.entities.SurveyQuestion.filter({ survey_id: surveyId });
      for (const q of questions) {
        await base44.entities.SurveyQuestion.delete(q.id);
      }
      // Delete responses
      const responses = await base44.entities.SurveyResponse.filter({ survey_id: surveyId });
      for (const r of responses) {
        await base44.entities.SurveyResponse.delete(r.id);
      }
      // Delete survey
      await base44.entities.Survey.delete(surveyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['surveys']);
      toast.success('הסקר נמחק');
    }
  });

  const copyLink = (survey) => {
    if (!survey.share_slug) {
      toast.error('הקישור עדיין לא זמין - יש לפרסם את הסקר');
      return;
    }
    const url = `${window.location.origin}${createPageUrl('RespondIntro')}?s=${survey.share_slug}`;
    navigator.clipboard.writeText(url);
    toast.success('הקישור הועתק');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-700 border-0">פעיל</Badge>;
      case 'draft':
        return <Badge className="bg-amber-100 text-amber-700 border-0">טיוטה</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-700 border-0">סגור</Badge>;
      case 'candidate':
        return <Badge className="bg-purple-100 text-purple-700 border-0">לא נבחר</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#E85A24] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#6B2D4A]">הסקרים שלי</h1>
        <Link to={createPageUrl('ActivityDescription')}>
          <Button className="bg-[#E85A24] hover:bg-[#D14A1A] text-white">
            <Plus className="w-4 h-4 ml-2" />
            סקר חדש
          </Button>
        </Link>
      </div>

      {/* Surveys List */}
      {surveys.length === 0 ? (
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-[#E85A24]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">אין סקרים עדיין</h3>
            <p className="text-gray-500 mb-6">צור את הסקר הראשון שלך</p>
            <Link to={createPageUrl('ActivityDescription')}>
              <Button className="bg-[#E85A24] hover:bg-[#D14A1A] text-white">
                <Plus className="w-4 h-4 ml-2" />
                צור סקר חדש
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {surveys.map((survey, index) => (
            <motion.div
              key={survey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {survey.title || survey.activity_description?.slice(0, 40) || 'סקר ללא שם'}
                        </h3>
                        {getStatusBadge(survey.status)}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span>
                          נוצר: {format(new Date(survey.created_date), 'dd/MM/yyyy', { locale: he })}
                        </span>
                        {survey.published_at && (
                          <span>
                            פורסם: {format(new Date(survey.published_at), 'dd/MM/yyyy', { locale: he })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          {survey.responses_count || 0} תגובות
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {survey.status === 'published' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyLink(survey)}
                            className="text-gray-500"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Link to={createPageUrl('ResultsOverview') + `?surveyId=${survey.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-500"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                          </Link>
                        </>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {survey.status === 'draft' && (
                            <DropdownMenuItem asChild>
                              <Link to={createPageUrl('SurveyEditor') + `?surveyId=${survey.id}`}>
                                <FileText className="w-4 h-4 ml-2" />
                                המשך עריכה
                              </Link>
                            </DropdownMenuItem>
                          )}
                          {survey.status === 'published' && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                const url = `${window.location.origin}${createPageUrl('RespondIntro')}?s=${survey.share_slug}`;
                                window.open(url, '_blank');
                              }}>
                                <ExternalLink className="w-4 h-4 ml-2" />
                                צפה בסקר
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyLink(survey)}>
                                <Copy className="w-4 h-4 ml-2" />
                                העתק קישור
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  if (confirm('האם לסגור את הסקר? לאחר הסגירה לא יתקבלו תגובות נוספות.')) {
                                    closeSurveyMutation.mutate(survey.id);
                                  }
                                }}
                                className="text-amber-600"
                              >
                                <XCircle className="w-4 h-4 ml-2" />
                                סגור סקר
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm('האם למחוק את הסקר? פעולה זו אינה ניתנת לביטול.')) {
                                deleteSurveyMutation.mutate(survey.id);
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            מחק סקר
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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