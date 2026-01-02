import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Edit2, Trash2, Plus, GripVertical,
  Save, ArrowRight, FileText, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const QUESTION_TYPE_LABELS = {
  scale_5: 'סולם 1-5',
  scale_7: 'סולם 1-7',
  open_text: 'שאלה פתוחה',
  single_choice: 'בחירה יחידה',
  multi_choice: 'בחירה מרובה',
  bottom_line: 'שאלת שורה תחתונה'
};

const KIT_DOMAIN_LABELS = {
  relevance: 'רלוונטיות',
  skills: 'מיומנויות',
  delivery_quality: 'איכות העברה',
  belonging: 'שייכות',
  none: '-'
};

export default function SurveyEditor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [surveyId, setSurveyId] = useState(null);
  const [editingIntro, setEditingIntro] = useState(false);
  const [introText, setIntroText] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('surveyId');
    if (id) setSurveyId(id);
  }, []);

  const { data: survey, isLoading: surveyLoading } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      const surveys = await base44.entities.Survey.filter({ id: surveyId });
      if (surveys.length > 0) {
        setIntroText(surveys[0].intro_text || '');
        return surveys[0];
      }
      return null;
    },
    enabled: !!surveyId
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['survey-questions', surveyId],
    queryFn: () => base44.entities.SurveyQuestion.filter({ survey_id: surveyId }, 'order_index'),
    enabled: !!surveyId
  });

  const updateIntroMutation = useMutation({
    mutationFn: (text) => base44.entities.Survey.update(surveyId, { intro_text: text }),
    onSuccess: () => {
      queryClient.invalidateQueries(['survey', surveyId]);
      setEditingIntro(false);
      toast.success('הפתיחה נשמרה');
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (questionId) => base44.entities.SurveyQuestion.delete(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['survey-questions', surveyId]);
      toast.success('השאלה נמחקה');
    }
  });

  const reorderMutation = useMutation({
    mutationFn: async (newOrder) => {
      for (let i = 0; i < newOrder.length; i++) {
        await base44.entities.SurveyQuestion.update(newOrder[i].id, { order_index: i });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['survey-questions', surveyId]);
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    queryClient.setQueryData(['survey-questions', surveyId], items);
    reorderMutation.mutate(items);
  };

  const handlePublish = () => {
    navigate(createPageUrl('PublishShare') + `?surveyId=${surveyId}`);
  };

  if (surveyLoading || questionsLoading) {
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
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            to={createPageUrl('ProfileSummary') + `?surveyId=${surveyId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ChevronRight className="w-5 h-5" />
            חזרה
          </Link>
          <h1 className="font-bold text-lg text-[#6B2D4A]">עריכת סקר</h1>
          <Button
            onClick={handlePublish}
            className="bg-[#E85A24] hover:bg-[#D14A1A] text-white"
          >
            פרסם
            <ChevronLeft className="w-4 h-4 mr-1" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Intro Section */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#6B2D4A]">פתיחת הסקר</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingIntro(!editingIntro)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
            
            {editingIntro ? (
              <div className="space-y-3">
                <Textarea
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  className="min-h-[100px] resize-none"
                  dir="rtl"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditingIntro(false)}>
                    ביטול
                  </Button>
                  <Button 
                    onClick={() => updateIntroMutation.mutate(introText)}
                    className="bg-[#E85A24] hover:bg-[#D14A1A]"
                  >
                    <Save className="w-4 h-4 ml-1" />
                    שמור
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 whitespace-pre-wrap">
                {survey?.intro_text || 'לא הוגדרה פתיחה'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Questions Section */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[#6B2D4A]">שאלות הסקר ({questions.length})</h2>
          <Link to={createPageUrl('AddQuestion') + `?surveyId=${surveyId}`}>
            <Button variant="outline" size="sm" className="text-[#E85A24] border-[#E85A24]">
              <Plus className="w-4 h-4 ml-1" />
              הוסף שאלה
            </Button>
          </Link>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {questions.map((question, index) => (
                  <Draggable key={question.id} draggableId={question.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${snapshot.isDragging ? 'opacity-80' : ''}`}
                      >
                        <Card className="bg-white border-0 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div
                                {...provided.dragHandleProps}
                                className="mt-1 cursor-grab text-gray-400 hover:text-gray-600"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="bg-orange-100 text-[#E85A24] text-xs px-2 py-1 rounded-full">
                                    {index + 1}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {QUESTION_TYPE_LABELS[question.question_type]}
                                  </span>
                                  {question.kit_domain && question.kit_domain !== 'none' && (
                                    <span className="text-xs text-gray-400">
                                      • {KIT_DOMAIN_LABELS[question.kit_domain]}
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-800 font-medium">
                                  {question.prompt_hebrew}
                                </p>
                              </div>

                              <div className="flex gap-1">
                                <Link to={createPageUrl('EditQuestion') + `?surveyId=${surveyId}&questionId=${question.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Edit2 className="w-4 h-4 text-gray-400" />
                                  </Button>
                                </Link>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => {
                                    if (confirm('האם למחוק את השאלה?')) {
                                      deleteQuestionMutation.mutate(question.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {questions.length === 0 && (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">אין שאלות בסקר</p>
              <Link to={createPageUrl('AddQuestion') + `?surveyId=${surveyId}`}>
                <Button className="mt-4 bg-[#E85A24] hover:bg-[#D14A1A]">
                  <Plus className="w-4 h-4 ml-1" />
                  הוסף שאלה ראשונה
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Publish Button */}
        <div className="pt-4">
          <Button
            onClick={handlePublish}
            className="w-full py-6 bg-[#E85A24] hover:bg-[#D14A1A] text-white text-lg font-medium rounded-xl shadow-lg shadow-orange-200"
          >
            פרסם וקבל קישור
            <ChevronLeft className="w-5 h-5 mr-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}