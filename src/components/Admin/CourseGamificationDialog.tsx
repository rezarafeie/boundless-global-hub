import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CourseGamificationSettings from '@/components/Admin/CourseGamificationSettings';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  courseId: string;
  courseTitle?: string;
}

const CourseGamificationDialog: React.FC<Props> = ({ open, onOpenChange, courseId, courseTitle }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent dir="rtl" className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>دسترسی گیمیفای — {courseTitle}</DialogTitle>
      </DialogHeader>
      <CourseGamificationSettings courseId={courseId} onSaved={() => onOpenChange(false)} />
    </DialogContent>
  </Dialog>
);

export default CourseGamificationDialog;
