import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Bug, Lightbulb, Heart, MessageSquare } from 'lucide-react';

const TYPES = [
  { value: 'bug', label: 'באג / תקלה', icon: Bug, color: 'text-red-500 bg-red-50 border-red-200' },
  { value: 'suggestion', label: 'הצעה לשיפור', icon: Lightbulb, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'compliment', label: 'מחמאה', icon: Heart, color: 'text-pink-500 bg-pink-50 border-pink-200' },
  { value: 'other', label: 'אחר', icon: MessageSquare, color: 'text-gray-500 bg-gray-50 border-gray-200' },
];

export default function FeedbackModal({ open, onClose }) {
  const [type, setType] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('אנא כתוב משוב לפני השליחה');
      return;
    }
    setLoading(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      await base44.entities.AppFeedback.create({
        type,
        message: message.trim(),
        page: window.location.pathname,
        user_email: user?.email || 'אנונימי',
        is_read: false,
      });
      toast.success('תודה! המשוב נשלח בהצלחה');
      setMessage('');
      setType('suggestion');
      onClose();
    } catch (e) {
      toast.error('שגיאה בשליחת המשוב');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-[#6B2D4A] text-xl">שלח משוב</DialogTitle>
          <p className="text-sm text-gray-500">המשוב שלך עוזר לנו לשפר את המערכת</p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 mt-2">
          {TYPES.map(({ value, label, icon: Icon, color }) => (
            <button
              key={value}
              onClick={() => setType(value)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                type === value ? color + ' border-current' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="ספר/י לנו מה חשבת, מה לא עבד, או מה אפשר לשפר..."
          className="min-h-[120px] resize-none mt-2"
          dir="rtl"
        />

        <div className="flex gap-2 justify-end mt-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#E85A24] hover:bg-[#D14A1A] text-white"
          >
            {loading ? 'שולח...' : 'שלח משוב'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}