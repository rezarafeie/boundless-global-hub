
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Tag } from 'lucide-react';

interface ConversationTagsProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  editable?: boolean;
}

const ConversationTags: React.FC<ConversationTagsProps> = ({
  tags,
  onTagsChange,
  editable = true
}) => {
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag('');
      setIsAdding(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === 'Escape') {
      setNewTag('');
      setIsAdding(false);
    }
  };

  const getTagColor = (tag: string) => {
    const colors = {
      'فوری': 'bg-red-100 text-red-800 border-red-200',
      'تکنیکی': 'bg-blue-100 text-blue-800 border-blue-200',
      'مالی': 'bg-green-100 text-green-800 border-green-200',
      'عمومی': 'bg-gray-100 text-gray-800 border-gray-200',
      'حل شده': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'پیگیری': 'bg-orange-100 text-orange-800 border-orange-200',
      'باگ': 'bg-purple-100 text-purple-800 border-purple-200',
      'درخواست ویژگی': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[tag as keyof typeof colors] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="outline"
          className={`text-xs ${getTagColor(tag)} ${editable ? 'pr-1' : ''}`}
        >
          <Tag className="w-3 h-3 ml-1" />
          {tag}
          {editable && (
            <button
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 hover:bg-red-200 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </Badge>
      ))}
      
      {editable && (
        <>
          {isAdding ? (
            <div className="flex items-center gap-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                onBlur={() => {
                  if (newTag.trim()) {
                    handleAddTag();
                  } else {
                    setIsAdding(false);
                  }
                }}
                placeholder="تگ جدید"
                className="w-20 h-6 text-xs"
                autoFocus
              />
              <Button
                onClick={handleAddTag}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsAdding(true)}
              size="sm"
              variant="ghost"
              className="h-6 text-xs text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-3 h-3 ml-1" />
              افزودن تگ
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default ConversationTags;
