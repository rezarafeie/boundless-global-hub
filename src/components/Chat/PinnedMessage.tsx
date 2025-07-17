import React from 'react';
import { Button } from '@/components/ui/button';
import { Pin, X } from 'lucide-react';

interface PinnedMessageProps {
  summary: string;
  onUnpin?: () => void;
  onClick: () => void;
  canUnpin: boolean;
}

const PinnedMessage: React.FC<PinnedMessageProps> = ({
  summary,
  onUnpin,
  onClick,
  canUnpin
}) => {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onClick}
          className="flex-1 flex items-start gap-2 text-left hover:opacity-80 transition-opacity"
        >
          <Pin className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
              پیام سنجاق شده
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200 line-clamp-2">
              {summary}
            </p>
          </div>
        </button>
        
        {canUnpin && onUnpin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onUnpin();
            }}
            className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PinnedMessage;