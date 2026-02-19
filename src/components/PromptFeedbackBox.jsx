import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Supports two call signatures:
// 1. <PromptFeedbackBox survey={surveyObj} />  (from SurveyEditor)
// 2. <PromptFeedbackBox surveyId="..." promptName="..." audience="..." activityDescription="..." />  (from GenerateSurvey)
export default function PromptFeedbackBox({ survey, surveyId, promptName: promptNameProp, audience: audienceProp, activityDescription: activityProp }) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const resolvedSurveyId = survey?.id || surveyId;
  const promptName = survey?.prompt_version || promptNameProp;
  const audience = survey?.audience || audienceProp;
  const activityDescription = survey?.activity_description || activityProp;

  // Load existing feedback on mount
  useEffect(() => {
    if (!resolvedSurveyId) return;
    base44.entities.PromptFeedback.filter({ survey_id: resolvedSurveyId }).then((existing) => {
      if (existing.length > 0) {
        const fb = existing[0];
        setStars(fb.stars || 0);
        setComment(fb.comment || '');
        setSubmitted(true);
      }
    }).catch(() => {});
  }, [resolvedSurveyId]);

  if (!promptName) return null;

  const handleSubmit = async () => {
    if (stars === 0) {
      toast.error('יש לבחור דירוג כוכבים');
      return;
    }
    setLoading(true);
    await base44.entities.PromptFeedback.create({
      survey_id: resolvedSurveyId,
      prompt_name: promptName,
      stars,
      comment,
      audience,
      activity_description: activityDescription?.slice(0, 100)
    });
    setSubmitted(true);
    setLoading(false);
    toast.success('תודה על המשוב!');
  };

  return (
    <div className="mt-8 bg-gradient-to-br from-purple-50 to-orange-50 rounded-2xl border border-purple-100 p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-[#6B2D4A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Star className="w-5 h-5 text-[#6B2D4A]" />
        </div>
        <div>
          <h3 className="font-bold text-[#6B2D4A] text-lg">איך הסקר הזה?</h3>
          <p className="text-sm text-gray-500">
            גרסה זו נוצרה עם: <strong>{promptName}</strong>
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Stars */}
            <div className="flex gap-2 justify-center mb-4" dir="ltr">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setStars(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      star <= (hovered || stars)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Comment */}
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="מה דעתך על איכות השאלות? מה עבד? מה פחות?"
              className="mb-4 resize-none min-h-[80px]"
              dir="rtl"
            />

            <Button
              onClick={handleSubmit}
              disabled={loading || stars === 0}
              className="w-full bg-[#6B2D4A] hover:bg-[#5A2540] text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Star className="w-4 h-4 ml-2" />}
              שלח משוב
            </Button>
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="font-bold text-green-700">תודה! המשוב שלך נשמר</p>
            <p className="text-sm text-gray-500 mt-1">הוא יעזור לנו לבחור את הפרומפט הטוב ביותר</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}