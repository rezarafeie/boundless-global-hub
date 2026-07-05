import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, Sparkles, Phone, BookOpen, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AssignmentCTA } from '@/types/assignment';

const iconFor = (t: AssignmentCTA['type']) => {
  switch (t) {
    case 'telegram': return <Send className="h-4 w-4 ml-2" />;
    case 'support': return <MessageCircle className="h-4 w-4 ml-2" />;
    case 'smart_test': return <Sparkles className="h-4 w-4 ml-2" />;
    case 'consultation': return <Phone className="h-4 w-4 ml-2" />;
    case 'course': return <BookOpen className="h-4 w-4 ml-2" />;
    default: return <ExternalLink className="h-4 w-4 ml-2" />;
  }
};

const urlFor = (cta: AssignmentCTA) => {
  switch (cta.type) {
    case 'smart_test': return '/assessment/boundless-smart-test';
    case 'support': return '/hub/messenger';
    case 'consultation': return '/consultation-booking';
    case 'course': return cta.course_slug ? `/course/${cta.course_slug}` : cta.url;
    default: return cta.url;
  }
};

export const CTASection: React.FC<{ ctas?: AssignmentCTA[] }> = ({ ctas }) => {
  const navigate = useNavigate();
  if (!ctas || ctas.length === 0) return null;
  return (
    <div className="space-y-2 pt-2 border-t">
      <div className="text-sm font-medium text-muted-foreground">قدم بعدی:</div>
      <div className="flex flex-wrap gap-2">
        {ctas.map((cta, i) => {
          const url = urlFor(cta);
          return (
            <Button
              key={i}
              variant="default"
              size="sm"
              onClick={() => {
                if (!url) return;
                if (url.startsWith('http')) window.open(url, '_blank');
                else navigate(url);
              }}
            >
              {iconFor(cta.type)}
              {cta.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
