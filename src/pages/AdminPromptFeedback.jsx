import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, BarChart3, MessageSquare, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ADMIN_PASSWORD = '1234';

export default function AdminPromptFeedback() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['prompt-feedbacks'],
    queryFn: () => base44.entities.PromptFeedback.list('-created_date', 200),
    enabled: isAuthenticated
  });

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-sm w-full">
          <CardHeader><CardTitle className="text-center">אזור ניהול — משובי פרומפטים</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="סיסמה"
              className="w-full border rounded px-3 py-2 text-sm"
              dir="ltr"
            />
            <button onClick={handleLogin} className="w-full bg-[#6B2D4A] text-white rounded py-2 font-medium hover:bg-[#5A2540]">
              כניסה
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group by prompt name
  const grouped = feedbacks.reduce((acc, fb) => {
    if (!acc[fb.prompt_name]) acc[fb.prompt_name] = [];
    acc[fb.prompt_name].push(fb);
    return acc;
  }, {});

  const promptStats = Object.entries(grouped).map(([name, items]) => ({
    name,
    count: items.length,
    avg: (items.reduce((s, i) => s + (i.stars || 0), 0) / items.length).toFixed(1),
    feedbacks: items
  })).sort((a, b) => b.avg - a.avg);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-[#6B2D4A]" />
            <h1 className="font-bold text-lg text-[#6B2D4A]">משובי פרומפטים</h1>
          </div>
          <Link to={createPageUrl('AdminPrompts')} className="text-sm text-[#E85A24] hover:underline">
            → ניהול פרומפטים
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {isLoading && <div className="text-center py-12"><Loader2 className="w-8 h-8 text-[#E85A24] animate-spin mx-auto" /></div>}

        {!isLoading && feedbacks.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>עדיין אין משובים. משובים יופיעו לאחר שמשתמשים ידרגו גרסאות סקר.</p>
            </CardContent>
          </Card>
        )}

        {promptStats.map((stat) => (
          <Card key={stat.name} className="border-2 border-gray-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-[#6B2D4A]">{stat.name}</CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{stat.count} משובים</span>
                  <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-yellow-700">{stat.avg}</span>
                    <span className="text-xs text-gray-500">/ 5</span>
                  </div>
                </div>
              </div>
              {/* Stars distribution */}
              <div className="flex gap-1 mt-2" dir="ltr">
                {[1,2,3,4,5].map(s => {
                  const cnt = stat.feedbacks.filter(f => f.stars === s).length;
                  const pct = stat.count > 0 ? (cnt / stat.count) * 100 : 0;
                  return (
                    <div key={s} className="flex-1 text-center">
                      <div className="h-12 bg-gray-100 rounded relative flex items-end">
                        <div className="bg-yellow-400 rounded w-full transition-all" style={{ height: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{s}★</p>
                    </div>
                  );
                })}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-72 overflow-y-auto">
              {stat.feedbacks.filter(f => f.comment).map((fb) => (
                <div key={fb.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex items-center gap-1 mb-1" dir="ltr">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3 h-3 ${s <= fb.stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                    {fb.audience && <span className="text-xs text-gray-400 mr-2">| {fb.audience}</span>}
                  </div>
                  <p className="text-gray-700">{fb.comment}</p>
                </div>
              ))}
              {stat.feedbacks.filter(f => !f.comment).length > 0 && (
                <p className="text-xs text-gray-400 text-center">{stat.feedbacks.filter(f => !f.comment).length} דירוגים ללא הערה</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}