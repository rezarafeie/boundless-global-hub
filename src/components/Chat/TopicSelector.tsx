
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <Select
          value={activeTopic?.id.toString() || ''}
          onValueChange={(value) => {
            const topic = topics.find(t => t.id.toString() === value);
            if (topic) onTopicChange(topic);
          }}
        >
          <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
            <SelectValue placeholder="انتخاب موضوع گفتگو" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600">
            {topics.map((topic) => (
              <SelectItem 
                key={topic.id} 
                value={topic.id.toString()}
                className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-amber-500" />
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
    <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-slate-700 overflow-x-auto bg-white dark:bg-slate-900">
      {topics.map((topic) => (
        <Button
          key={topic.id}
          onClick={() => onTopicChange(topic)}
          variant={activeTopic?.id === topic.id ? "default" : "ghost"}
          className={`flex items-center gap-2 whitespace-nowrap transition-all duration-200 ${
            activeTopic?.id === topic.id 
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md' 
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{topic.title}</span>
        </Button>
      ))}
    </div>
  );
};

export default TopicSelector;
