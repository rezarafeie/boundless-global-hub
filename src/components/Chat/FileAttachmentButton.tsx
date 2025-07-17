import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Image, FileText, Video, Music, File } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FileAttachmentButtonProps {
  onFileSelect: (files: FileList) => void;
  disabled?: boolean;
}

const FileAttachmentButton: React.FC<FileAttachmentButtonProps> = ({
  onFileSelect,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(files);
    }
    // Reset the input
    event.target.value = '';
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => handleFileSelect('image/*')}>
            <Image className="w-4 h-4 ml-2" />
            تصاویر
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFileSelect('video/*')}>
            <Video className="w-4 h-4 ml-2" />
            ویدیوها
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFileSelect('audio/*')}>
            <Music className="w-4 h-4 ml-2" />
            موسیقی
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFileSelect('application/pdf')}>
            <FileText className="w-4 h-4 ml-2" />
            PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleFileSelect('*')}>
            <File className="w-4 h-4 ml-2" />
            همه فایل‌ها
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
};

export default FileAttachmentButton;