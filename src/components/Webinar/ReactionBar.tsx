import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface ReactionBarProps {
  webinarId: string;
  participantId: string | undefined;
  reactionCounts: Record<string, number>;
}

const REACTIONS = [
  { type: 'understood', label: 'فهمیدم', emoji: '✅' },
  { type: 'repeat', label: 'دوباره بگو', emoji: '🤔' },
  { type: 'excellent', label: 'عالی بود', emoji: '🔥' },
  { type: 'important', label: 'مهم بود', emoji: '🧠' },
];

const ReactionBar: React.FC<ReactionBarProps> = ({ webinarId, participantId, reactionCounts }) => {
  const [cooldown, setCooldown] = useState<Record<string, boolean>>({});
  const [spamCount, setSpamCount] = useState(0);

  const sendReaction = useCallback(async (type: string) => {
    if (!participantId || cooldown[type]) return;

    if (spamCount >= 5) {
      // Soft limit
      setCooldown(prev => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCooldown(prev => ({ ...prev, [type]: false }));
        setSpamCount(0);
      }, 3000);
      return;
    }

    setSpamCount(prev => prev + 1);
    setCooldown(prev => ({ ...prev, [type]: true }));
    setTimeout(() => setCooldown(prev => ({ ...prev, [type]: false })), 800);

    await supabase.from('webinar_reactions').insert({
      webinar_id: webinarId,
      participant_id: participantId,
      reaction_type: type,
    });
  }, [webinarId, participantId, cooldown, spamCount]);

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {REACTIONS.map(r => (
        <motion.div key={r.type} whileTap={{ scale: 0.9 }}>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-xs"
            onClick={() => sendReaction(r.type)}
            disabled={cooldown[r.type] && spamCount >= 5}
          >
            <span className="text-base">{r.emoji}</span>
            <span>{r.label}</span>
            <span className="text-muted-foreground text-[10px]">
              {reactionCounts[r.type] || 0}
            </span>
          </Button>
        </motion.div>
      ))}
      {spamCount >= 5 && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground self-center"
        >
          آروم‌تر 😅
        </motion.span>
      )}
    </div>
  );
};

export default ReactionBar;
