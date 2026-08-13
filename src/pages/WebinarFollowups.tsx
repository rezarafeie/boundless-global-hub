import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import WebinarFollowupsEditor from '@/components/Admin/WebinarFollowupsEditor';

const WebinarFollowups: React.FC = () => {
  const { webinarId } = useParams<{ webinarId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (!webinarId) return;
    supabase
      .from('webinar_entries')
      .select('title')
      .eq('id', webinarId)
      .maybeSingle()
      .then(({ data }) => setTitle((data as any)?.title || ''));
  }, [webinarId]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl" dir="rtl">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/enroll/admin/webinar')}>
          <ArrowRight className="h-4 w-4 ml-1" /> بازگشت
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title ? `${title} — پیگیری‌ها` : 'پیگیری‌های وبینار'}</CardTitle>
        </CardHeader>
        <CardContent>
          {webinarId && <WebinarFollowupsEditor webinarId={webinarId} />}
        </CardContent>
      </Card>
    </div>
  );
};

export default WebinarFollowups;
