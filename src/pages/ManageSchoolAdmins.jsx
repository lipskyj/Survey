import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Shield, User, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { SCHOOLS_LIST } from '@/lib/schoolsList';

export default function ManageSchoolAdmins() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users-admin'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
  });

  const schools = SCHOOLS_LIST;

  const updateUser = async (userId, data) => {
    setSaving(userId);
    await base44.entities.User.update(userId, data);
    qc.invalidateQueries(['all-users-admin']);
    setSaving(null);
  };

  const nonAdminUsers = users.filter(u => u.role !== 'admin');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" size="icon"><ArrowRight className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#1E3A6E]">ניהול אדמינים מקומיים</h1>
          <p className="text-gray-500 text-sm">שייך משתמשים לבתי ספר ומנה אדמינים מקומיים</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">טוען...</div>
      ) : (
        <div className="space-y-3">
          {nonAdminUsers.map(u => (
            <Card key={u.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${u.role === 'network_admin' ? 'bg-purple-100' : u.role === 'school_admin' ? 'bg-[#1E3A6E]/10' : 'bg-gray-100'}`}>
                      {u.role === 'network_admin' ? <Globe className="w-4 h-4 text-purple-600" /> : u.role === 'school_admin' ? <Shield className="w-4 h-4 text-[#1E3A6E]" /> : <User className="w-4 h-4 text-gray-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{u.full_name || u.email}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* School select */}
                    <Select
                      value={u.school || ''}
                      onValueChange={val => updateUser(u.id, { school: val })}
                      disabled={saving === u.id}
                    >
                      <SelectTrigger className="w-44 text-sm h-8">
                        <SelectValue placeholder="בחר בית ספר" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Role buttons */}
                    <Button
                      size="sm"
                      variant={u.role === 'network_admin' ? 'default' : 'outline'}
                      className={u.role === 'network_admin' ? 'bg-purple-600 text-white h-8 text-xs' : 'h-8 text-xs text-purple-600 border-purple-300'}
                      disabled={saving === u.id}
                      onClick={() => updateUser(u.id, { role: u.role === 'network_admin' ? 'user' : 'network_admin' })}
                    >
                      {u.role === 'network_admin' ? 'אדמין רשת ✓' : 'אדמין רשת'}
                    </Button>
                    <Button
                      size="sm"
                      variant={u.role === 'school_admin' ? 'default' : 'outline'}
                      className={u.role === 'school_admin' ? 'bg-[#1E3A6E] text-white h-8 text-xs' : 'h-8 text-xs'}
                      disabled={saving === u.id}
                      onClick={() => updateUser(u.id, { role: u.role === 'school_admin' ? 'user' : 'school_admin' })}
                    >
                      {u.role === 'school_admin' ? 'אדמין מקומי ✓' : 'מנה אדמין'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {nonAdminUsers.length === 0 && (
            <p className="text-center text-gray-400 py-12">אין משתמשים רשומים</p>
          )}
        </div>
      )}
    </div>
  );
}