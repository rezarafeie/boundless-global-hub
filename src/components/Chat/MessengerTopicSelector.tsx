
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Hash, Plus } from 'lucide-react';
import { type ChatTopic, type MessengerRoom, type MessengerUser } from '@/lib/messengerService';

interface MessengerTopicSelectorProps {
  topics: ChatTopic[];
  selectedTopic: ChatTopic | null;
  onTopicSelect: (topic: ChatTopic | null) => void;
  currentRoom: MessengerRoom;
  currentUser: MessengerUser;
  onTopicsUpdate: () => void;
}

const MessengerTopicSelector: React.FC<MessengerTopicSelectorProps> = ({
  topics,
  selectedTopic,
  onTopicSelect,
  currentRoom,
  currentUser,
  onTopicsUpdate
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant={selectedTopic === null ? "default" : "ghost"}
        size="sm"
        onClick={() => onTopicSelect(null)}
        className="flex items-center gap-1"
      >
        <Hash className="h-3 w-3" />
        General
      </Button>
      
      {topics.map((topic) => (
        <Button
          key={topic.id}
          variant={selectedTopic?.id === topic.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onTopicSelect(topic)}
          className="flex items-center gap-1"
        >
          <span>{topic.icon || '🔹'}</span>
          {topic.title}
        </Button>
      ))}
      
      {currentUser.is_messenger_admin && (
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1"
        >
          <Plus className="h-3 w-3" />
          New Topic
        </Button>
      )}
    </div>
  );
};

export default MessengerTopicSelector;
