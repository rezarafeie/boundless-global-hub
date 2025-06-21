
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  children?: React.ReactNode;
}

const EMOJI_CATEGORIES = {
  'اخیر': ['😀', '😂', '🥰', '😍', '👍', '❤️', '🔥', '💯'],
  'احساسات': ['😀', '😂', '🤣', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😎', '🤔', '😐', '😑', '🙄', '😴', '🤤', '😷', '🤒', '🤕'],
  'اشاره': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '☝️', '👆', '🖕', '👇', '✋', '🤚', '🖐️', '🖖', '👋', '🤝'],
  'اشیاء': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💯', '💢', '💥', '💦', '💨', '🕳️', '💬', '🗯️', '💭', '🔥', '⭐']
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('اخیر');
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      {children ? (
        <div onClick={() => setIsOpen(!isOpen)}>
          {children}
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-500 hover:text-amber-500 hover:bg-transparent p-2"
        >
          <Smile className="w-5 h-5" />
        </Button>
      )}

      {isOpen && (
        <div className="absolute bottom-12 left-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl w-80 z-50">
          {/* Category tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-600 p-2">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeCategory === category
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="p-3 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
            {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 text-xl hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;
