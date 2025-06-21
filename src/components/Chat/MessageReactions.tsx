
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Heart, Laugh, ThumbsUp, ThumbsDown, Eye, Frown } from 'lucide-react';

interface MessageReaction {
  id: string;
  message_id: number;
  user_id: number;
  reaction: string;
  created_at: string;
}

interface MessageReactionsProps {
  messageId: number;
  reactions?: MessageReaction[];
  onAddReaction: (messageId: number, reaction: string) => void;
  currentUserId: number;
}

const REACTION_EMOJIS = [
  { emoji: '❤️', icon: Heart, label: 'Love' },
  { emoji: '😂', icon: Laugh, label: 'Laugh' },
  { emoji: '👍', icon: ThumbsUp, label: 'Like' },
  { emoji: '👎', icon: ThumbsDown, label: 'Dislike' },
  { emoji: '😮', icon: Eye, label: 'Wow' },
  { emoji: '😢', icon: Frown, label: 'Sad' }
];

const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions = [],
  onAddReaction,
  currentUserId
}) => {
  const [showReactions, setShowReactions] = useState(false);

  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.reaction] = (acc[reaction.reaction] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const userReactions = reactions
    .filter(r => r.user_id === currentUserId)
    .map(r => r.reaction);

  const handleReactionClick = (emoji: string) => {
    onAddReaction(messageId, emoji);
    setShowReactions(false);
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      {/* Show existing reactions */}
      {Object.entries(reactionCounts).map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => handleReactionClick(emoji)}
          className={`text-xs px-2 py-1 rounded-full border transition-colors ${
            userReactions.includes(emoji)
              ? 'bg-blue-100 border-blue-300 text-blue-700'
              : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {emoji} {count}
        </button>
      ))}

      {/* Add reaction button */}
      <Popover open={showReactions} onOpenChange={setShowReactions}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto">
            +
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {REACTION_EMOJIS.map(({ emoji, label }) => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className="p-2 text-lg hover:bg-gray-100 rounded transition-colors"
                title={label}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MessageReactions;
