import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bug, Lightbulb, Heart, MessageSquare, Check, Inbox } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_CONFIG = {
  bug: { label: 'באג / תקלה', icon: Bug, color: 'bg-red-100 text-red-700' },
  suggestion: { label: 'הצעה לשיפור', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-700' },
  compliment: { label: 'מחמאה', icon: Heart, color: 'bg-pink-100 text-pink-700' },
  other: { label: 'אחר', icon: MessageSquare, color: 'bg-gray-100 text-gray-600' },
};

export default function AppFeedbackTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['app-feedbacks'],
    queryFn: () => base44.entities.AppFeedback.list('-created_date', 200),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.AppFeedback.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-feedbacks'] });
      toast.success('סומן כנקרא');
    },
  });

  const filtered = filter === 'all' ? feedbacks
    : filter === 'unread' ? feedbacks.filter(f => !f.is_read)
    : feedbacks.filter(f => f.type === filter);

  const unreadCount = feedbacks.filter(f => !f.is_read).length;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: `הכל (${feedbacks.length})` },
          { value: 'unread', label: `לא נקראו (${unreadCount})` },
          { value: 'bug', label: 'באגים' },
          { value: 'suggestion', label: 'הצעות' },
          { value: 'compliment', label: 'מחמאות' },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === opt.value
                ? 'bg-[#6B2D4A] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-center text-gray-400 py-8">טוען...</p>}

      {!isLoading && filtered.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">אין משובים להצגה</p>
          </CardContent>
        </Card>
      )}

      {filtered.map(fb => {
        const config = TYPE_CONFIG[fb.type] || TYPE_CONFIG.other;
        const Icon = config.icon;
        return (
          <Card key={fb.id} className={`border-2 ${fb.is_read ? 'border-gray-100' : 'border-[#E85A24]/30 bg-orange-50/30'}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${config.color}`}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                    {!fb.is_read && (
                      <span className="bg-[#E85A24] text-white text-xs px-2 py-0.5 rounded-full">חדש</span>
                    )}
                    <span className="text-xs text-gray-400">{fb.page || ''}</span>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed">{fb.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{fb.user_email}</span>
                    <span>{new Date(fb.created_date).toLocaleDateString('he-IL')}</span>
                  </div>
                </div>
                {!fb.is_read && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markReadMutation.mutate(fb.id)}
                    className="flex-shrink-0 text-xs"
                  >
                    <Check className="w-3 h-3 ml-1" />
                    סמן כנקרא
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}