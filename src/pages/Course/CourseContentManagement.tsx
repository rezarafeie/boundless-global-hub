
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Edit, Trash2, GripVertical, Save, X, ExternalLink, Code, Eye, Bell, Edit2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { courseNotificationService } from '@/lib/courseNotificationService';
import type { Notification, NotificationInsert } from '@/types/notifications';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import MainLayout from '@/components/Layout/MainLayout';
import CrossCourseLessonCopy from '@/components/Course/CrossCourseLessonCopy';
import { useLessonNumber } from '@/hooks/useLessonNumber';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface CourseTitleGroup {
  id: string;
  title: string;
  icon: string;
  order_index: number;
  course_id: string;
  created_at: string;
  updated_at: string;
  is_open: boolean;
}

interface CourseSection {
  id: string;
  title: string;
  order_index: number;
  course_id: string;
  title_group_id?: string;
  created_at: string;
  updated_at: string;
}

interface CourseLesson {
  id: string;
  title: string;
  content: string;
  video_url?: string;
  file_url?: string;
  duration: number;
  order_index: number;
  section_id: string;
  course_id: string;
  created_at: string;
  updated_at: string;
  section_ids?: string[]; // For multiple section support
}

interface Course {
  id: string;
  title: string;
  slug: string;
}

const CourseContentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [titleGroups, setTitleGroups] = useState<CourseTitleGroup[]>([]);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showTitleGroupModal, setShowTitleGroupModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingTitleGroup, setEditingTitleGroup] = useState<CourseTitleGroup | null>(null);
  const [editingSection, setEditingSection] = useState<CourseSection | null>(null);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const { getLessonNumberById } = useLessonNumber();
  
  // Collapsed state for sections - start with all sections collapsed
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  
  // Collapsed state for lessons - start with all lessons collapsed
  const [collapsedLessons, setCollapsedLessons] = useState<Set<string>>(new Set());
  
  // Initialize collapsed sections when data loads
  useEffect(() => {
    if (sections.length > 0 && collapsedSections.size === 0) {
      setCollapsedSections(new Set(sections.map(s => s.id)));
    }
  }, [sections]);

  // Initialize collapsed lessons when data loads
  useEffect(() => {
    if (lessons.length > 0 && collapsedLessons.size === 0) {
      setCollapsedLessons(new Set(lessons.map(l => l.id)));
    }
  }, [lessons]);
  
  // Form states
  const [titleGroupForm, setTitleGroupForm] = useState({ title: '', icon: '📚', is_open: false });
  const [sectionForm, setSectionForm] = useState({ title: '', title_group_id: '', is_open: false });
  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    video_url: '',
    file_url: '',
    section_ids: [] as string[],
    duration: 15
  });
  const [videoInputMode, setVideoInputMode] = useState<'url' | 'embed'>('url');

  // Notification management state
  const [courseNotifications, setCourseNotifications] = useState<Notification[]>([]);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    color: '#3B82F6',
    link: '',
    notification_type: 'banner' as 'banner' | 'floating' | 'popup',
    is_active: false,
    priority: 1,
    start_date: '',
    end_date: ''
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  const loadCourseNotifications = async () => {
    if (!courseId) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('course_id', courseId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCourseNotifications((data || []) as Notification[]);
    } catch (error) {
      console.error('Error loading course notifications:', error);
    }
  };

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      await loadCourseNotifications();
      // Fetch course info
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch title groups
      const { data: titleGroupsData, error: titleGroupsError } = await supabase
        .from('course_title_groups')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (titleGroupsError) throw titleGroupsError;
      setTitleGroups(titleGroupsData || []);

      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('course_sections')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (sectionsError) throw sectionsError;
      setSections(sectionsData || []);

      // Fetch lessons with their section relationships
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('course_lessons')
        .select(`
          *,
          lesson_sections!inner(section_id)
        `)
        .eq('course_id', courseId)
        .order('order_index');

      if (lessonsError) throw lessonsError;
      
      // Process lessons to include section_ids array
      const processedLessons = (lessonsData || []).map(lesson => ({
        ...lesson,
        section_ids: lesson.lesson_sections?.map(ls => ls.section_id) || [lesson.section_id].filter(Boolean)
      }));
      
      setLessons(processedLessons);

    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اطلاعات دوره",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/enroll/admin?tab=courses');
  };

  const resetTitleGroupForm = () => {
    setTitleGroupForm({ title: '', icon: '📚', is_open: false });
    setEditingTitleGroup(null);
  };

  const resetSectionForm = () => {
    setSectionForm({ title: '', title_group_id: '', is_open: false });
    setEditingSection(null);
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: '',
      content: '',
      video_url: '',
      file_url: '',
      section_ids: [],
      duration: 15
    });
    setEditingLesson(null);
  };

  const handleSaveTitleGroup = async () => {
    try {
      if (editingTitleGroup) {
        // Update existing title group
        const { error } = await supabase
          .from('course_title_groups')
          .update({
            title: titleGroupForm.title.trim(),
            icon: titleGroupForm.icon,
            is_open: titleGroupForm.is_open
          })
          .eq('id', editingTitleGroup.id);
        
        if (error) throw error;
        
        toast({ title: "عنوان با موفقیت ویرایش شد" });
      } else {
        // Create new title group
        const { data: existingGroups } = await supabase
          .from('course_title_groups')
          .select('order_index')
          .eq('course_id', courseId)
          .order('order_index', { ascending: false })
          .limit(1);

        const nextOrderIndex = existingGroups?.[0]?.order_index + 1 || 0;

        const { error } = await supabase
          .from('course_title_groups')
          .insert({
            course_id: courseId,
            title: titleGroupForm.title.trim(),
            icon: titleGroupForm.icon,
            order_index: nextOrderIndex,
            is_open: titleGroupForm.is_open
          });
        
        if (error) throw error;
        
        toast({ title: "عنوان جدید با موفقیت ایجاد شد" });
      }

      setShowTitleGroupModal(false);
      resetTitleGroupForm();
      fetchCourseData();
    } catch (error) {
      console.error('Error saving title group:', error);
      toast({
        title: "خطا",
        description: "خطا در ذخیره عنوان",
        variant: "destructive"
      });
    }
  };

  const handleEditTitleGroup = (titleGroup: CourseTitleGroup) => {
    setEditingTitleGroup(titleGroup);
    setTitleGroupForm({ title: titleGroup.title, icon: titleGroup.icon, is_open: titleGroup.is_open });
    setShowTitleGroupModal(true);
  };

  const handleEditSection = (section: CourseSection) => {
    setEditingSection(section);
    setSectionForm({ title: section.title, title_group_id: section.title_group_id || '', is_open: false });
    setShowSectionModal(true);
  };

  const handleEditLesson = async (lesson: CourseLesson) => {
    try {
      // Fetch current section relationships for this lesson
      const { data: lessonSections, error } = await supabase
        .from('lesson_sections')
        .select('section_id')
        .eq('lesson_id', lesson.id);

      if (error) throw error;

      setEditingLesson(lesson);
      setLessonForm({
        title: lesson.title,
        content: lesson.content,
        video_url: lesson.video_url || '',
        file_url: lesson.file_url || '',
        section_ids: lessonSections?.map(ls => ls.section_id) || [lesson.section_id].filter(Boolean),
        duration: lesson.duration || 15
      });
      
      // Detect if it's an embed code or URL
      const videoUrl = lesson.video_url || '';
      setVideoInputMode(videoUrl.includes('<') && videoUrl.includes('>') ? 'embed' : 'url');
      
      setShowLessonModal(true);
    } catch (error) {
      console.error('Error fetching lesson sections:', error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری اطلاعات درس",
        variant: "destructive"
      });
    }
  };

  const handleSaveSection = async () => {
    if (!sectionForm.title.trim()) {
      toast({
        title: "خطا",
        description: "عنوان بخش الزامی است",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingSection) {
        // Update existing section
        const { error } = await supabase
          .from('course_sections')
          .update({
            title: sectionForm.title.trim(),
            title_group_id: sectionForm.title_group_id || null
          })
          .eq('id', editingSection.id);
        
        if (error) throw error;
        
        toast({ title: "بخش با موفقیت ویرایش شد" });
      } else {
        // Create new section
        const { data: existingSections } = await supabase
          .from('course_sections')
          .select('order_index')
          .eq('course_id', courseId)
          .order('order_index', { ascending: false })
          .limit(1);

        const nextOrderIndex = existingSections?.[0]?.order_index + 1 || 0;

        const { error } = await supabase
          .from('course_sections')
          .insert({
            course_id: courseId,
            title: sectionForm.title.trim(),
            title_group_id: sectionForm.title_group_id || null,
            order_index: nextOrderIndex
          });
        
        if (error) throw error;
        
        toast({ title: "بخش جدید با موفقیت ایجاد شد" });
      }

      setShowSectionModal(false);
      resetSectionForm();
      fetchCourseData();
    } catch (error) {
      console.error('Error saving section:', error);
      toast({
        title: "خطا",
        description: "خطا در ذخیره بخش",
        variant: "destructive"
      });
    }
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim() || lessonForm.section_ids.length === 0) {
      toast({
        title: "خطا",
        description: "عنوان درس و انتخاب حداقل یک بخش الزامی است",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingLesson) {
        // Update existing lesson
        const { error: updateError } = await supabase
          .from('course_lessons')
          .update({
            title: lessonForm.title.trim(),
            content: lessonForm.content.trim(),
            video_url: lessonForm.video_url.trim() || null,
            file_url: lessonForm.file_url.trim() || null,
            duration: lessonForm.duration
          })
          .eq('id', editingLesson.id);
        
        if (updateError) throw updateError;

        // Update section relationships
        // First delete existing relationships
        const { error: deleteError } = await supabase
          .from('lesson_sections')
          .delete()
          .eq('lesson_id', editingLesson.id);

        if (deleteError) throw deleteError;

        // Insert new relationships
        const lessonSectionInserts = lessonForm.section_ids.map(sectionId => ({
          lesson_id: editingLesson.id,
          section_id: sectionId
        }));

        const { error: insertError } = await supabase
          .from('lesson_sections')
          .insert(lessonSectionInserts);

        if (insertError) throw insertError;
        
        toast({ title: "درس با موفقیت به‌روزرسانی شد" });
      } else {
        // Create new lesson
        const { data: newLesson, error: lessonError } = await supabase
          .from('course_lessons')
          .insert({
            title: lessonForm.title.trim(),
            content: lessonForm.content.trim(),
            video_url: lessonForm.video_url.trim() || null,
            file_url: lessonForm.file_url.trim() || null,
            course_id: courseId,
            section_id: lessonForm.section_ids[0], // Keep for backward compatibility
            order_index: 0, // Will be updated by ordering logic
            duration: lessonForm.duration
          })
          .select()
          .single();
        
        if (lessonError) throw lessonError;

        // Insert lesson-section relationships
        const lessonSectionInserts = lessonForm.section_ids.map(sectionId => ({
          lesson_id: newLesson.id,
          section_id: sectionId
        }));

        const { error: insertError } = await supabase
          .from('lesson_sections')
          .insert(lessonSectionInserts);

        if (insertError) throw insertError;
        
        toast({ 
          title: lessonForm.section_ids.length > 1 
            ? `درس جدید در ${lessonForm.section_ids.length} بخش ایجاد شد` 
            : "درس جدید با موفقیت ایجاد شد" 
        });
      }

      setShowLessonModal(false);
      resetLessonForm();
      fetchCourseData();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast({
        title: "خطا",
        description: "خطا در ذخیره درس",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTitleGroup = async (titleGroupId: string) => {
    if (!confirm('آیا از حذف این عنوان و تمام بخش‌های آن اطمینان دارید؟')) return;

    try {
      const { error } = await supabase
        .from('course_title_groups')
        .delete()
        .eq('id', titleGroupId);

      if (error) throw error;
      
      toast({ title: "عنوان حذف شد" });
      fetchCourseData();
    } catch (error) {
      console.error('Error deleting title group:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف عنوان",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('آیا از حذف این بخش و تمام دروس آن اطمینان دارید؟')) return;

    try {
      // First delete all lessons in this section
      const { error: lessonsError } = await supabase
        .from('course_lessons')
        .delete()
        .eq('section_id', sectionId);

      if (lessonsError) throw lessonsError;

      // Then delete the section
      const { error: sectionError } = await supabase
        .from('course_sections')
        .delete()
        .eq('id', sectionId);

      if (sectionError) throw sectionError;
      
      toast({ title: "بخش با موفقیت حذف شد" });
      fetchCourseData();
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف بخش",
        variant: "destructive"
      });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('آیا از حذف این درس اطمینان دارید؟')) return;

    try {
      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
      
      toast({ title: "درس با موفقیت حذف شد" });
      fetchCourseData();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف درس",
        variant: "destructive"
      });
    }
  };

  // Drag end handlers
  const handleSectionDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex(section => section.id === active.id);
      const newIndex = sections.findIndex(section => section.id === over.id);

      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSections(newSections);

      // Update order in database
      try {
        const updates = newSections.map((section, index) => ({
          id: section.id,
          order_index: index + 1
        }));

        for (const update of updates) {
          await supabase
            .from('course_sections')
            .update({ order_index: update.order_index })
            .eq('id', update.id);
        }

        toast({ title: "ترتیب بخش‌ها به‌روزرسانی شد" });
      } catch (error) {
        console.error('Error updating section order:', error);
        toast({
          title: "خطا",
          description: "خطا در به‌روزرسانی ترتیب بخش‌ها",
          variant: "destructive"
        });
        // Revert the change
        fetchCourseData();
      }
    }
  };

  const handleLessonDragEnd = async (event: DragEndEvent, sectionId: string) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const sectionLessons = lessons.filter(l => l.section_id === sectionId);
      const oldIndex = sectionLessons.findIndex(lesson => lesson.id === active.id);
      const newIndex = sectionLessons.findIndex(lesson => lesson.id === over.id);

      const newSectionLessons = arrayMove(sectionLessons, oldIndex, newIndex);
      
      // Update lessons state
      const updatedLessons = lessons.map(lesson => {
        if (lesson.section_id === sectionId) {
          const newLesson = newSectionLessons.find(nl => nl.id === lesson.id);
          return newLesson || lesson;
        }
        return lesson;
      });
      setLessons(updatedLessons);

      // Update order in database
      try {
        const updates = newSectionLessons.map((lesson, index) => ({
          id: lesson.id,
          order_index: index + 1
        }));

        for (const update of updates) {
          await supabase
            .from('course_lessons')
            .update({ order_index: update.order_index })
            .eq('id', update.id);
        }

        toast({ title: "ترتیب دروس به‌روزرسانی شد" });
      } catch (error) {
        console.error('Error updating lesson order:', error);
        toast({
          title: "خطا",
          description: "خطا در به‌روزرسانی ترتیب دروس",
          variant: "destructive"
        });
        // Revert the change
        fetchCourseData();
      }
    }
  };

  // Notification management functions
  const handleCreateNotification = async () => {
    if (!courseId) return;
    
    try {
      const notificationData: Omit<NotificationInsert, 'course_id'> = {
        title: notificationForm.title,
        message: notificationForm.message,
        color: notificationForm.color,
        link: notificationForm.link || null,
        notification_type: notificationForm.notification_type,
        is_active: notificationForm.is_active,
        priority: notificationForm.priority,
        start_date: notificationForm.start_date || null,
        end_date: notificationForm.end_date || null
      };

      await courseNotificationService.createCourseNotification(courseId, notificationData);
      await loadCourseNotifications();
      setShowNotificationForm(false);
      resetNotificationForm();
      
      toast({
        title: "موفقیت",
        description: "اعلان جدید ایجاد شد"
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "خطا",
        description: "خطا در ایجاد اعلان",
        variant: "destructive"
      });
    }
  };

  const handleUpdateNotification = async () => {
    if (!editingNotification) return;
    
    try {
      const updates: Partial<NotificationInsert> = {
        title: notificationForm.title,
        message: notificationForm.message,
        color: notificationForm.color,
        link: notificationForm.link || null,
        notification_type: notificationForm.notification_type,
        is_active: notificationForm.is_active,
        priority: notificationForm.priority,
        start_date: notificationForm.start_date || null,
        end_date: notificationForm.end_date || null
      };

      await courseNotificationService.updateCourseNotification(editingNotification.id, updates);
      await loadCourseNotifications();
      setShowNotificationForm(false);
      setEditingNotification(null);
      resetNotificationForm();
      
      toast({
        title: "موفقیت",
        description: "اعلان به‌روزرسانی شد"
      });
    } catch (error) {
      console.error('Error updating notification:', error);
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی اعلان",
        variant: "destructive"
      });
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      await courseNotificationService.deleteCourseNotification(notificationId);
      await loadCourseNotifications();
      
      toast({
        title: "موفقیت",
        description: "اعلان حذف شد"
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "خطا",
        description: "خطا در حذف اعلان",
        variant: "destructive"
      });
    }
  };

  const resetNotificationForm = () => {
    setNotificationForm({
      title: '',
      message: '',
      color: '#3B82F6',
      link: '',
      notification_type: 'banner',
      is_active: false,
      priority: 1,
      start_date: '',
      end_date: ''
    });
  };

  const openNotificationForm = (notification?: Notification) => {
    if (notification) {
      setEditingNotification(notification);
      setNotificationForm({
        title: notification.title,
        message: notification.message,
        color: notification.color,
        link: notification.link || '',
        notification_type: notification.notification_type as 'banner' | 'floating' | 'popup',
        is_active: notification.is_active,
        priority: notification.priority,
        start_date: notification.start_date ? notification.start_date.split('T')[0] : '',
        end_date: notification.end_date ? notification.end_date.split('T')[0] : ''
      });
    } else {
      setEditingNotification(null);
      resetNotificationForm();
    }
    setShowNotificationForm(true);
  };

  // Video Embed Component
const VideoEmbed: React.FC<{ embedCode: string; className?: string }> = ({ embedCode, className = "" }) => {
  // Check if it's HTML embed code (contains < and >)
  const isHtmlEmbed = embedCode.includes('<') && embedCode.includes('>');
  
  if (isHtmlEmbed) {
    // Create a unique container ID for each embed to avoid conflicts
    const containerId = `video-embed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    React.useEffect(() => {
      const container = document.getElementById(containerId);
      if (container) {
        // Clear any existing content
        container.innerHTML = '';
        // Set the HTML content which will execute any scripts
        container.innerHTML = embedCode;
      }
    }, [embedCode, containerId]);
    
    return <div id={containerId} className={`video-embed-container ${className}`} />;
  } else {
    // Treat as regular URL
    return (
      <div className={`${className}`}>
        <a 
          href={embedCode} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ExternalLink className="h-4 w-4" />
          مشاهده ویدیو
        </a>
      </div>
    );
  }
};

// Video Input Component
const VideoInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  mode: 'url' | 'embed';
  onModeChange: (mode: 'url' | 'embed') => void;
}> = ({ value, onChange, mode, onModeChange }) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label>ویدیو درس</Label>
        <div className="flex bg-muted rounded-lg p-1">
          <Button
            type="button"
            variant={mode === 'url' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('url')}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 ml-1" />
            لینک
          </Button>
          <Button
            type="button"
            variant={mode === 'embed' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onModeChange('embed')}
            className="text-xs"
          >
            <Code className="h-3 w-3 ml-1" />
            کد جاسازی
          </Button>
        </div>
      </div>

      {mode === 'url' ? (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/video.mp4"
        />
      ) : (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='<div id="49476976912"><script type="text/JavaScript" src="https://www.aparat.com/embed/i6095n5?data[rnddiv]=49476976912&data[responsive]=yes"></script></div>'
          rows={4}
        />
      )}

      {value && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 ml-1" />
            {showPreview ? 'مخفی کردن پیش‌نمایش' : 'نمایش پیش‌نمایش'}
          </Button>
        </div>
      )}

      {showPreview && value && (
        <div className="border rounded-lg p-4 bg-muted/50">
          <h4 className="font-medium mb-2">پیش‌نمایش:</h4>
          <VideoEmbed embedCode={value} />
        </div>
      )}
    </div>
  );
};

// Sortable Section Component
const SortableSection: React.FC<{ 
  section: CourseSection; 
  lessons: CourseLesson[];
  onEditSection: (section: CourseSection) => void;
  onDeleteSection: (sectionId: string) => void;
  onEditLesson: (lesson: CourseLesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onLessonDragEnd: (event: DragEndEvent, sectionId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: (sectionId: string) => void;
  collapsedLessons: Set<string>;
  setCollapsedLessons: (collapsed: Set<string>) => void;
}> = ({ section, lessons, onEditSection, onDeleteSection, onEditLesson, onDeleteLesson, onLessonDragEnd, isCollapsed, onToggleCollapse, collapsedLessons, setCollapsedLessons }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sectionLessons = lessons.filter(l => 
    l.section_ids?.includes(section.id) || l.section_id === section.id
  );

  return (
    <Card ref={setNodeRef} style={style}>
      <CardHeader 
        className="cursor-pointer" 
        onClick={() => onToggleCollapse(section.id)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GripVertical 
              className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" 
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="mr-2">
              {isCollapsed ? '▶' : '▼'}
            </span>
            {section.title}
            <Badge variant="secondary" className="text-xs">
              {sectionLessons.length} درس
            </Badge>
          </CardTitle>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditSection(section)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDeleteSection(section.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent>
          {sectionLessons.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              هنوز درسی در این بخش ایجاد نشده است
            </p>
          ) : (
            <DndContext
              sensors={useSensors(
                useSensor(PointerSensor),
                useSensor(KeyboardSensor, {
                  coordinateGetter: sortableKeyboardCoordinates,
                })
              )}
              collisionDetection={closestCenter}
              onDragEnd={(event) => onLessonDragEnd(event, section.id)}
            >
              <SortableContext 
                items={sectionLessons.map(l => l.id)} 
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {sectionLessons.map(lesson => (
                    <SortableLesson
                      key={lesson.id}
                      lesson={lesson}
                      onEdit={onEditLesson}
                      onDelete={onDeleteLesson}
                      isCollapsed={collapsedLessons.has(lesson.id)}
                      onToggleCollapse={(lessonId) => {
                        const newCollapsed = new Set(collapsedLessons);
                        if (newCollapsed.has(lessonId)) {
                          newCollapsed.delete(lessonId);
                        } else {
                          newCollapsed.add(lessonId);
                        }
                        setCollapsedLessons(newCollapsed);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      )}
    </Card>
  );
};

// Sortable Lesson Component
const SortableLesson: React.FC<{
  lesson: CourseLesson;
  onEdit: (lesson: CourseLesson) => void;
  onDelete: (lessonId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: (lessonId: string) => void;
}> = ({ lesson, onEdit, onDelete, isCollapsed, onToggleCollapse }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-muted/50 rounded-lg border transition-all duration-200"
    >
      {/* Lesson Header - Always Visible */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/70"
        onClick={() => onToggleCollapse(lesson.id)}
      >
        <div className="flex items-center gap-2 flex-1">
          <GripVertical 
            className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" 
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="mr-2">
            {isCollapsed ? '▶' : '▼'}
          </span>
          <span className="font-medium">{lesson.title}</span>
          <div className="flex gap-1">
            {lesson.video_url && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                ویدیو
              </span>
            )}
            {lesson.file_url && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                فایل
              </span>
            )}
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
              {lesson.duration} دقیقه
            </span>
          </div>
        </div>
        
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const lessonNumber = await getLessonNumberById(lesson.id);
                if (lessonNumber && course) {
                  const accessUrl = `${window.location.origin}/access?course=${course.slug}&lesson=${lessonNumber}`;
                  await navigator.clipboard.writeText(accessUrl);
                  toast({
                    title: "لینک کپی شد",
                    description: `لینک درس ${lessonNumber} کپی شد`,
                    duration: 2000,
                  });
                } else {
                  toast({
                    title: "خطا",
                    description: "خطا در تولید لینک درس",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                console.error('Error copying lesson link:', error);
                toast({
                  title: "خطا",
                  description: "خطا در کپی کردن لینک",
                  variant: "destructive",
                });
              }
            }}
            title="کپی لینک درس"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(lesson)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(lesson.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Lesson Content - Collapsible */}
      {!isCollapsed && (
        <div className="px-4 pb-4 animate-accordion-down">
          {/* Show video embed if exists */}
          {lesson.video_url && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <VideoEmbed embedCode={lesson.video_url} />
            </div>
          )}
          
          {/* Show lesson content preview if exists */}
          {lesson.content && (
            <div className="mt-3 p-3 bg-background rounded-lg border">
              <h5 className="font-medium mb-2">محتوای درس:</h5>
              <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ 
                  __html: lesson.content.length > 200 
                    ? lesson.content.substring(0, 200) + '...' 
                    : lesson.content 
                }} />
              </div>
            </div>
          )}

          {/* Show file link if exists */}
          {lesson.file_url && (
            <div className="mt-3 p-3 bg-background rounded-lg border">
              <h5 className="font-medium mb-2">فایل پیوست:</h5>
              <div className="text-sm text-blue-600 hover:text-blue-800 underline break-all">
                <a 
                  href={lesson.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {lesson.file_url.length > 60 ? `${lesson.file_url.substring(0, 60)}...` : lesson.file_url}
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              مدیریت محتوای دوره: {course?.title}
            </h1>
            <p className="text-muted-foreground mt-2">
              مدیریت بخش‌ها و دروس دوره
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Dialog open={showTitleGroupModal} onOpenChange={setShowTitleGroupModal}>
            <DialogTrigger asChild>
              <Button onClick={resetTitleGroupForm} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 ml-2" />
                افزودن عنوان جدید
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTitleGroup ? 'ویرایش عنوان' : 'افزودن عنوان جدید'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="titlegroup-title">عنوان</Label>
                  <Input
                    id="titlegroup-title"
                    value={titleGroupForm.title}
                    onChange={(e) => setTitleGroupForm({ ...titleGroupForm, title: e.target.value })}
                    placeholder="مثال: هدایای دوره"
                  />
                </div>
                <div>
                  <Label htmlFor="titlegroup-icon">آیکون</Label>
                  <div className="flex gap-2 mt-2">
                    {['📚', '🎁', '💎', '🏆', '⭐', '🔥', '💡', '🎯', '🚀', '🌟'].map((icon) => (
                      <Button
                        key={icon}
                        type="button"
                        variant={titleGroupForm.icon === icon ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTitleGroupForm({ ...titleGroupForm, icon })}
                        className="text-lg h-10 w-10 p-0"
                      >
                        {icon}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="titlegroup-open"
                    checked={titleGroupForm.is_open}
                    onCheckedChange={(checked) => setTitleGroupForm({ ...titleGroupForm, is_open: checked })}
                  />
                  <Label htmlFor="titlegroup-open">باز بودن به صورت پیش‌فرض</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowTitleGroupModal(false)}>
                    لغو
                  </Button>
                  <Button onClick={handleSaveTitleGroup}>
                    <Save className="h-4 w-4 ml-2" />
                    ذخیره
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showSectionModal} onOpenChange={setShowSectionModal}>
            <DialogTrigger asChild>
              <Button onClick={resetSectionForm}>
                <Plus className="h-4 w-4 ml-2" />
                افزودن بخش جدید
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSection ? 'ویرایش بخش' : 'افزودن بخش جدید'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="section-titlegroup">عنوان والد (اختیاری)</Label>
                  <select
                    id="section-titlegroup"
                    value={sectionForm.title_group_id}
                    onChange={(e) => setSectionForm({ ...sectionForm, title_group_id: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">بدون عنوان والد</option>
                    {titleGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.icon} {group.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="section-title">عنوان بخش</Label>
                  <Input
                    id="section-title"
                    value={sectionForm.title}
                    onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                    placeholder="عنوان بخش را وارد کنید"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSectionModal(false)}>
                    لغو
                  </Button>
                  <Button onClick={handleSaveSection}>
                    <Save className="h-4 w-4 ml-2" />
                    ذخیره
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showLessonModal} onOpenChange={setShowLessonModal}>
            <DialogTrigger asChild>
              <Button onClick={resetLessonForm} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                <Plus className="h-4 w-4 ml-2" />
                افزودن درس جدید
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <CrossCourseLessonCopy 
            currentCourseId={courseId!}
            onLessonsCopied={fetchCourseData}
          />
        </div>

        {/* Lesson Modal */}
        <Dialog open={showLessonModal} onOpenChange={setShowLessonModal}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingLesson ? 'ویرایش درس' : 'افزودن درس جدید'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="lesson-sections">
                    بخش‌ها (می‌توانید چندین بخش انتخاب کنید)
                  </Label>
                  <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-2">
                    {sections.map(section => (
                      <label key={section.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lessonForm.section_ids.includes(section.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setLessonForm(prev => ({ 
                                ...prev, 
                                section_ids: [...prev.section_ids, section.id] 
                              }));
                            } else {
                              setLessonForm(prev => ({ 
                                ...prev, 
                                section_ids: prev.section_ids.filter(id => id !== section.id) 
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{section.title}</span>
                      </label>
                    ))}
                  </div>
                  {lessonForm.section_ids.length > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      انتخاب شده: {lessonForm.section_ids.length} بخش
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="lesson-title">عنوان درس</Label>
                  <Input
                    id="lesson-title"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="عنوان درس را وارد کنید"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lesson-content">محتوای درس</Label>
                  <Textarea
                    id="lesson-content"
                    value={lessonForm.content}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="محتوای درس (HTML پشتیبانی می‌شود)"
                    rows={6}
                  />
                </div>
                <VideoInput
                  value={lessonForm.video_url}
                  onChange={(value) => setLessonForm(prev => ({ ...prev, video_url: value }))}
                  mode={videoInputMode}
                  onModeChange={setVideoInputMode}
                />
                <div>
                  <Label htmlFor="lesson-file">لینک فایل</Label>
                  <Input
                    id="lesson-file"
                    value={lessonForm.file_url}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, file_url: e.target.value }))}
                    placeholder="https://example.com/file.pdf"
                  />
                </div>
                <div>
                  <Label htmlFor="lesson-duration">مدت زمان (دقیقه)</Label>
                  <Input
                    id="lesson-duration"
                    type="number"
                    min="1"
                    max="300"
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 15 }))}
                    placeholder="15"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowLessonModal(false)}>
                    لغو
                  </Button>
                  <Button onClick={handleSaveLesson}>
                    <Save className="h-4 w-4 ml-2" />
                    ذخیره
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

        {/* Content */}
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">محتوای دوره</TabsTrigger>
            <TabsTrigger value="title-groups">گروه‌های عنوان</TabsTrigger>
            <TabsTrigger value="notifications">اعلان‌های دوره</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6">
          {titleGroups.length === 0 && sections.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  هنوز محتوایی برای این دوره ایجاد نشده است
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  با کلیک روی "افزودن عنوان جدید" یا "افزودن بخش جدید" شروع کنید
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Title Groups with their sections */}
              {titleGroups.map(titleGroup => {
                const groupSections = sections.filter(s => s.title_group_id === titleGroup.id);
                return (
                  <div key={titleGroup.id} className="space-y-4">
                    {/* Title Group Header */}
                    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{titleGroup.icon}</span>
                            <div>
                              <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">
                                {titleGroup.title}
                              </h2>
                              <p className="text-sm text-muted-foreground">
                                {groupSections.length} بخش در این عنوان
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTitleGroup(titleGroup)}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteTitleGroup(titleGroup.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    {/* Sections under this title group */}
                    {groupSections.length > 0 && (
                      <div className="space-y-4 ml-8">
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleSectionDragEnd}
                        >
                          <SortableContext items={groupSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            {groupSections.map(section => (
                              <SortableSection
                                key={section.id}
                                section={section}
                                lessons={lessons}
                                onEditSection={handleEditSection}
                                onDeleteSection={handleDeleteSection}
                                onEditLesson={handleEditLesson}
                                onDeleteLesson={handleDeleteLesson}
                                onLessonDragEnd={handleLessonDragEnd}
                                isCollapsed={collapsedSections.has(section.id)}
                                onToggleCollapse={(sectionId) => {
                                  const newCollapsed = new Set(collapsedSections);
                                  if (newCollapsed.has(sectionId)) {
                                    newCollapsed.delete(sectionId);
                                  } else {
                                    newCollapsed.add(sectionId);
                                  }
                                  setCollapsedSections(newCollapsed);
                                }}
                                collapsedLessons={collapsedLessons}
                                setCollapsedLessons={setCollapsedLessons}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Sections without title groups */}
              {sections.filter(s => !s.title_group_id).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-muted-foreground">سایر بخش‌ها</h3>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSectionDragEnd}
                  >
                    <SortableContext 
                      items={sections.filter(s => !s.title_group_id).map(s => s.id)} 
                      strategy={verticalListSortingStrategy}
                    >
                      {sections.filter(s => !s.title_group_id).map(section => (
                        <SortableSection
                          key={section.id}
                          section={section}
                          lessons={lessons}
                          onEditSection={handleEditSection}
                          onDeleteSection={handleDeleteSection}
                          onEditLesson={handleEditLesson}
                          onDeleteLesson={handleDeleteLesson}
                          onLessonDragEnd={handleLessonDragEnd}
                          isCollapsed={collapsedSections.has(section.id)}
                          onToggleCollapse={(sectionId) => {
                            const newCollapsed = new Set(collapsedSections);
                            if (newCollapsed.has(sectionId)) {
                              newCollapsed.delete(sectionId);
                            } else {
                              newCollapsed.add(sectionId);
                            }
                            setCollapsedSections(newCollapsed);
                          }}
                          collapsedLessons={collapsedLessons}
                          setCollapsedLessons={setCollapsedLessons}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          )}
          </TabsContent>

          {/* Title Groups Tab */}
          <TabsContent value="title-groups" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">گروه‌های عنوان</h3>
                <p className="text-muted-foreground text-sm">
                  عناوین سازمان‌دهنده برای گروه‌بندی بخش‌های دوره
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              {titleGroups.map((group) => (
                <Card key={group.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{group.icon}</span>
                      <div>
                        <h4 className="font-semibold">{group.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          ترتیب: {group.order_index}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTitleGroup(group)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTitleGroup(group.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {titleGroups.length === 0 && (
                <Card className="p-8 text-center">
                  <h4 className="font-semibold mb-2">هیچ گروه عنوانی وجود ندارد</h4>
                  <p className="text-muted-foreground text-sm">
                    اولین گروه عنوان را ایجاد کنید
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Course Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">اعلان‌های دوره</h3>
                <p className="text-muted-foreground text-sm">
                  اعلان‌هایی که در صفحه دسترسی دوره نمایش داده می‌شوند
                </p>
              </div>
              <Button 
                onClick={() => openNotificationForm()}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                افزودن اعلان جدید
              </Button>
            </div>

            <div className="space-y-4">
              {courseNotifications.map((notification) => (
                <Card key={notification.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{notification.title}</h4>
                        <Badge 
                          variant={notification.is_active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {notification.is_active ? 'فعال' : 'غیرفعال'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {notification.notification_type === 'banner' && 'بنر'}
                          {notification.notification_type === 'floating' && 'شناور'}
                          {notification.notification_type === 'popup' && 'پاپ‌آپ'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>اولویت: {notification.priority}</span>
                        {notification.start_date && (
                          <span>شروع: {new Date(notification.start_date).toLocaleDateString('fa-IR')}</span>
                        )}
                        {notification.end_date && (
                          <span>پایان: {new Date(notification.end_date).toLocaleDateString('fa-IR')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: notification.color }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openNotificationForm(notification)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {courseNotifications.length === 0 && (
                <Card className="p-8 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-semibold mb-2">هیچ اعلانی وجود ندارد</h4>
                  <p className="text-muted-foreground text-sm mb-4">
                    اولین اعلان دوره را ایجاد کنید
                  </p>
                  <Button onClick={() => openNotificationForm()}>
                    افزودن اعلان جدید
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Notification Form Dialog */}
        <Dialog open={showNotificationForm} onOpenChange={setShowNotificationForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingNotification ? 'ویرایش اعلان' : 'افزودن اعلان جدید'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notification-title">عنوان اعلان</Label>
                  <Input
                    id="notification-title"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="مثال: اپدیت جدید اضافه شد"
                  />
                </div>
                <div>
                  <Label htmlFor="notification-type">نوع اعلان</Label>
                  <Select 
                    value={notificationForm.notification_type} 
                    onValueChange={(value: 'banner' | 'floating' | 'popup') => 
                      setNotificationForm(prev => ({ ...prev, notification_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banner">بنر</SelectItem>
                      <SelectItem value="floating">شناور</SelectItem>
                      <SelectItem value="popup">پاپ‌آپ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notification-message">متن اعلان</Label>
                <Textarea
                  id="notification-message"
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="توضیحات کامل اعلان..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="notification-color">رنگ اعلان</Label>
                  <Input
                    id="notification-color"
                    type="color"
                    value={notificationForm.color}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="notification-priority">اولویت</Label>
                  <Input
                    id="notification-priority"
                    type="number"
                    min="1"
                    max="10"
                    value={notificationForm.priority}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="notification-active"
                    checked={notificationForm.is_active}
                    onCheckedChange={(checked) => setNotificationForm(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="notification-active">فعال</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notification-start">تاریخ شروع (اختیاری)</Label>
                  <Input
                    id="notification-start"
                    type="date"
                    value={notificationForm.start_date}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="notification-end">تاریخ پایان (اختیاری)</Label>
                  <Input
                    id="notification-end"
                    type="date"
                    value={notificationForm.end_date}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notification-link">لینک (اختیاری)</Label>
                <Input
                  id="notification-link"
                  value={notificationForm.link}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNotificationForm(false)}>
                انصراف
              </Button>
              <Button 
                onClick={editingNotification ? handleUpdateNotification : handleCreateNotification}
                disabled={!notificationForm.title || !notificationForm.message}
              >
                {editingNotification ? 'به‌روزرسانی' : 'ایجاد'} اعلان
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default CourseContentManagement;
