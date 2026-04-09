import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { School } from 'lucide-react';
import { SCHOOLS_LIST } from '@/lib/schoolsList';

export default function SchoolSetupModal({ open, onDone }) {
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);

  const schools = SCHOOLS_LIST;

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    await base44.auth.updateMe({ school: selected });
    setSaving(false);
    onDone(selected);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
        <div className="w-16 h-16 bg-[#1E3A6E]/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <School className="w-8 h-8 text-[#1E3A6E]" />
        </div>
        <h2 className="text-xl font-black text-[#1E3A6E] mb-2">באיזה בית ספר את/ה עובד/ת?</h2>
        <p className="text-gray-500 text-sm mb-6">זה יעזור לנו לשייך את הסקרים שלך לבית הספר הנכון</p>

        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-full mb-4 text-right">
            <SelectValue placeholder="בחר בית ספר..." />
          </SelectTrigger>
          <SelectContent>
            {schools.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          className="w-full bg-[#1E3A6E] hover:bg-[#2952A3] text-white rounded-xl"
          disabled={!selected || saving}
          onClick={handleSave}
        >
          {saving ? 'שומר...' : 'המשך'}
        </Button>
      </div>
    </div>
  );
}