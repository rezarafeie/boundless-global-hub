
import React from 'react';
import EnrollmentButton from './EnrollmentButton';

interface CourseEnrollmentSectionProps {
  courseId: string;
  courseName: string;
  isFreeCourse?: boolean;
  price?: string;
  className?: string;
}

const CourseEnrollmentSection: React.FC<CourseEnrollmentSectionProps> = ({
  courseId,
  courseName,
  isFreeCourse = false,
  price,
  className = ""
}) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg ${className}`}>
      <div className="text-center space-y-4">
        {!isFreeCourse && price && (
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {price}
          </div>
        )}
        
        <EnrollmentButton
          courseId={courseId}
          courseName={courseName}
          isFreeCourse={isFreeCourse}
          className="w-full py-3 text-lg font-semibold"
        />
        
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isFreeCourse 
            ? 'دسترسی فوری پس از ثبت‌نام'
            : 'پس از تکمیل پرداخت دسترسی فوری خواهید داشت'
          }
        </p>
      </div>
    </div>
  );
};

export default CourseEnrollmentSection;
