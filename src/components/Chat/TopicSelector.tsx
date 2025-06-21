
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';
import type { ChatTopic } from '@/types/supabase';

interface TopicSelectorProps {
  topics: ChatTopic[];
  activeTopic: ChatTopic | null;
  onTopicChange: (topic: ChatTopic) => void;
  isMobile?: boolean;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ 
  topics, 
  activeTopic, 
  onTopicChange, 
  isMobile = false 
}) => {
  if (isMobile) {
    return (
      <div className="p-4 border-b border-slate-700">
        <Select
          value={activeTopic?.id.toString() || ''}
          onValueChange={(value) => {
            const topic = topics.find(t => t.id.toString() === value);
            if (topic) onTopicChange(topic);
          }}
        >
          <SelectTrigger className="w-full bg-slate-800 border-slate-600 text-white">
            <SelectValue placeholder="انتخاب موضوع گفتگو" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            {topics.map((topic) => (
              <SelectItem 
                key={topic.id} 
                value={topic.id.toString()}
                className="text-white hover:bg-slate-700"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-amber-400" />
                  <span>{topic.title}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-4 border-b border-slate-700 overflow-x-auto">
      {topics.map((topic) => (
        <Button
          key={topic.id}
          onClick={() => onTopicChange(topic)}
          variant={activeTopic?.id === topic.id ? "default" : "ghost"}
          className={`flex items-center gap-2 whitespace-nowrap ${
            activeTopic?.id === topic.id 
              ? 'bg-amber-600 hover:bg-amber-700 text-white' 
              : 'text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{topic.title}</span>
          <Badge className="bg-slate-600 text-slate-200 text-xs">
            {topic.id}
          </Badge>
        </Button>
      ))}
    </div>
  );
};

export default TopicSelector;
