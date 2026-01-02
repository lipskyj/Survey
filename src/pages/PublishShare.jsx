import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, Share2, Copy, Check, QrCode, 
  MessageCircle, Mail, Loader2, ExternalLink, Lock
} from 'lucide-react';
import { toast } from 'sonner';
// Simple QR Code component using external API
function SimpleQRCode({ value, size = 200 }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  return (
    <div className="bg-white p-4 rounded-xl inline-block">
      <img src={qrUrl} alt="QR Code" width={size} height={size} />
    </div>
  );
}

export default function PublishShare() {
  const navigate = useNavigate();
  const [surveyId, setSurveyId] = useState(null);
  const [survey, setSurvey] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const loadSurvey = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('surveyId');
      if (id) {
        setSurveyId(id);
        const surveys = await base44.entities.Survey.filter({ id });
        if (surveys.length > 0) {
          setSurvey(surveys[0]);
          if (surveys[0].status === 'published' && surveys[0].share_slug) {
            setIsPublished(true);
            setShareUrl(`${window.location.origin}${createPageUrl('RespondIntro')}?s=${surveys[0].share_slug}`);
          }
        }
      }
    };
    loadSurvey();
  }, []);

  const generateSlug = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let slug = '';
    for (let i = 0; i < 8; i++) {
      slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return slug;
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const slug = generateSlug();
      await base44.entities.Survey.update(surveyId, {
        status: 'published',
        share_slug: slug,
        published_at: new Date().toISOString()
      });
      
      const url = `${window.location.origin}${createPageUrl('RespondIntro')}?s=${slug}`;
      setShareUrl(url);
      setIsPublished(true);
      toast.success('הסקר פורסם בהצלחה!');
    } catch (error) {
      toast.error('שגיאה בפרסום הסקר');
    }
    setIsPublishing(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('הקישור הועתק');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('שגיאה בהעתקה');
    }
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`היי, אשמח אם תוכל/י למלא סקר קצר:\n${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('הזמנה למלא סקר משוב');
    const body = encodeURIComponent(`שלום,\n\nאשמח אם תוכל/י להקדיש מספר דקות למילוי סקר משוב קצר.\n\nקישור לסקר: ${shareUrl}\n\nתודה!`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            to={createPageUrl('SurveyEditor') + `?surveyId=${surveyId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ChevronRight className="w-5 h-5" />
            חזרה לעריכה
          </Link>
          <h1 className="font-bold text-lg text-[#6B2D4A]">
            {isPublished ? 'שיתוף הסקר' : 'פרסום הסקר'}
          </h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!isPublished ? (
            <motion.div
              key="pre-publish"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Share2 className="w-10 h-10 text-[#E85A24]" />
              </div>
              
              <h2 className="text-2xl font-bold text-[#6B2D4A] mb-4">
                הסקר מוכן לפרסום
              </h2>
              <p className="text-gray-500 mb-8">
                לאחר הפרסום תקבל קישור ייחודי לשיתוף הסקר עם המשיבים
              </p>

              <Card className="bg-amber-50 border-amber-200 mb-6">
                <CardContent className="p-4 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-right">
                    <p className="text-sm text-amber-800">
                      <strong>שים לב:</strong> לאחר הפרסום לא ניתן לערוך את השאלות.
                      וודא שהסקר מוכן לפני הפרסום.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handlePublish}
                disabled={isPublishing}
                className="w-full py-6 bg-[#E85A24] hover:bg-[#D14A1A] text-white text-lg font-medium rounded-xl shadow-lg shadow-orange-200"
              >
                {isPublishing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Share2 className="w-5 h-5 ml-2" />
                    פרסם וקבל קישור
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="post-publish"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-[#6B2D4A] mb-2">
                  הסקר פורסם!
                </h2>
                <p className="text-gray-500">
                  שתף את הקישור עם המשיבים
                </p>
              </div>

              {/* Share Link */}
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-4">
                  <label className="text-sm text-gray-500 block mb-2">קישור לסקר</label>
                  <div className="flex gap-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="bg-gray-50 text-sm"
                      dir="ltr"
                    />
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      className={copied ? "bg-green-50 border-green-200 text-green-600" : ""}
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Share Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={shareViaWhatsApp}
                  variant="outline"
                  className="py-6 text-green-600 border-green-200 hover:bg-green-50"
                >
                  <MessageCircle className="w-5 h-5 ml-2" />
                  שלח ב-WhatsApp
                </Button>
                <Button
                  onClick={shareViaEmail}
                  variant="outline"
                  className="py-6 text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Mail className="w-5 h-5 ml-2" />
                  שלח באימייל
                </Button>
              </div>

              {/* QR Code */}
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-4">
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-gray-500" />
                      <span className="font-medium">קוד QR</span>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showQR ? 'rotate-90' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showQR && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 flex justify-center"
                      >
                        <SimpleQRCode value={shareUrl} size={180} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Preview Link */}
              <Button
                variant="outline"
                onClick={() => window.open(shareUrl, '_blank')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 ml-2" />
                צפה בסקר
              </Button>

              {/* Go to Results */}
              <Link to={createPageUrl('ResultsOverview') + `?surveyId=${surveyId}`}>
                <Button className="w-full py-6 bg-[#6B2D4A] hover:bg-[#5a2640] text-white text-lg">
                  מעבר לתוצאות
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}