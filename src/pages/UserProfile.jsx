import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SCHOOLS_LIST } from '@/lib/schoolsList';
import { ChevronRight, User, School, Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_LABELS = {
  admin: 'מנהל ראשי',
  network_admin: 'אדמין רשת',
  school_admin: 'אדמין מקומי',
  user: 'מורה / משתמש',
};

export default function UserProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      // Map stored 'none' back to sentinel for select
      if (u.school && u.school !== 'none') setSelectedSchool(u.school);
      else if (u.school === 'none') setSelectedSchool('__none__');
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!selectedSchool) return;
    setSaving(true);
    const schoolValue = selectedSchool === '__none__' ? 'none' : selectedSchool;
    await base44.auth.updateMe({ school: schoolValue });
    setCurrentUser(prev => ({ ...prev, school: schoolValue }));
    setSaving(false);
    setSaved(true);
    toast.success('הפרופיל עודכן בהצלחה');
    setTimeout(() => setSaved(false), 3000);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#E85A24] rounded-full animate-spin" />
      </div>
    );
  }

  const displaySchool = currentUser.school === 'none' || !currentUser.school
    ? 'ללא שיוך'
    : currentUser.school;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon"><ChevronRight className="w-5 h-5" /></Button>
          </Link>
          <h1 className="font-bold text-[#6B2D4A] text-lg">הפרופיל שלי</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        {/* User Info Card */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-[#1E3A6E]/10 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-[#1E3A6E]" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800 text-lg">{currentUser.full_name}</h2>
                <p className="text-gray-500 text-sm">{currentUser.email}</p>
                <span className="text-xs bg-orange-100 text-[#E85A24] px-2 py-0.5 rounded-full mt-1 inline-block">
                  {ROLE_LABELS[currentUser.role] || currentUser.role}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* School Assignment Card */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <School className="w-5 h-5 text-[#1E3A6E]" />
              <h3 className="font-semibold text-gray-800">שיוך לבית ספר</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              כרגע: <span className="font-medium text-gray-700">{displaySchool}</span>
            </p>

            <Select value={selectedSchool} onValueChange={setSelectedSchool} dir="rtl">
              <SelectTrigger className="w-full mb-4 text-right">
                <SelectValue placeholder="בחר בית ספר..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">ללא שיוך (מטה / יחידה כללית)</SelectItem>
                {SCHOOLS_LIST.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              className="w-full bg-[#1E3A6E] hover:bg-[#2952A3] text-white"
              disabled={!selectedSchool || saving}
              onClick={handleSave}
            >
              {saving ? 'שומר...' : saved ? (
                <><CheckCircle className="w-4 h-4 ml-2" />נשמר!</>
              ) : (
                <><Save className="w-4 h-4 ml-2" />שמור שינויים</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}