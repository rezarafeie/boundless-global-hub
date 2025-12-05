import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  GripVertical, 
  Loader2,
  Settings,
  Users,
  BookOpen,
  ArrowLeft,
  Check,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Pipeline {
  id: string;
  title: string;
  description: string | null;
  assigned_course_ids: string[];
  assigned_sales_agent_ids: number[];
  is_active: boolean;
  created_at: string;
  stages?: PipelineStage[];
}

interface PipelineStage {
  id: string;
  pipeline_id: string;
  title: string;
  color: string;
  order_index: number;
}

interface Agent {
  id: number;
  name: string;
  phone: string;
}

interface Course {
  id: string;
  title: string;
}

const STAGE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

// Sortable Stage Item Component
interface SortableStageItemProps {
  stage: PipelineStage;
  index: number;
  editingStage: PipelineStage | null;
  setEditingStage: (stage: PipelineStage | null) => void;
  handleUpdateStage: (stage: PipelineStage) => void;
  handleDeleteStage: (stageId: string) => void;
}

const SortableStageItem: React.FC<SortableStageItemProps> = ({
  stage,
  index,
  editingStage,
  setEditingStage,
  handleUpdateStage,
  handleDeleteStage,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border rounded-md bg-background"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div 
        className="w-4 h-4 rounded-full shrink-0" 
        style={{ backgroundColor: stage.color }}
      />
      {editingStage?.id === stage.id ? (
        <>
          <Input
            value={editingStage.title}
            onChange={(e) => setEditingStage({ ...editingStage, title: e.target.value })}
            className="flex-1 h-8"
          />
          <select
            value={editingStage.color}
            onChange={(e) => setEditingStage({ ...editingStage, color: e.target.value })}
            className="h-8 border rounded px-2 bg-background"
          >
            {STAGE_COLORS.map(color => (
              <option key={color} value={color} style={{ backgroundColor: color }}>
                {color}
              </option>
            ))}
          </select>
          <Button size="sm" variant="ghost" onClick={() => handleUpdateStage(editingStage)}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditingStage(null)}>
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1">{stage.title}</span>
          <Badge variant="secondary">{index + 1}</Badge>
          <Button size="sm" variant="ghost" onClick={() => setEditingStage({ ...stage })}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDeleteStage(stage.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};

const PipelineBuilder: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStagesDialog, setShowStagesDialog] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  
  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCourses, setFormCourses] = useState<string[]>([]);
  const [formAgents, setFormAgents] = useState<number[]>([]);
  
  // Stage form states
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState(STAGE_COLORS[0]);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchPipelines(), fetchAgents(), fetchCourses()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPipelines = async () => {
    const { data, error } = await supabase
      .from('pipelines')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching pipelines:', error);
      return;
    }

    // Fetch stages for each pipeline
    const pipelinesWithStages = await Promise.all((data || []).map(async (pipeline) => {
      const { data: stagesData } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', pipeline.id)
        .order('order_index');
      
      return { ...pipeline, stages: stagesData || [] };
    }));

    setPipelines(pipelinesWithStages);
  };

  const fetchAgents = async () => {
    const { data } = await supabase
      .from('chat_users')
      .select('id, name, phone')
      .eq('role', 'sales_agent')
      .order('name');
    
    setAgents(data || []);
  };

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title')
      .eq('is_active', true)
      .order('title');
    
    setCourses(data || []);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormCourses([]);
    setFormAgents([]);
    setStages([]);
  };

  const handleCreatePipeline = async () => {
    if (!formTitle.trim()) {
      toast({ title: "خطا", description: "عنوان پایپ‌لاین الزامی است", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: pipeline, error } = await supabase
        .from('pipelines')
        .insert({
          title: formTitle,
          description: formDescription || null,
          assigned_course_ids: formCourses,
          assigned_sales_agent_ids: formAgents,
          created_by: user?.messengerData?.id || null
        })
        .select()
        .single();

      if (error) throw error;

      // Create default stages
      const defaultStages = [
        { title: 'جدید', color: '#3B82F6', order_index: 0 },
        { title: 'در حال پیگیری', color: '#F59E0B', order_index: 1 },
        { title: 'در حال مذاکره', color: '#8B5CF6', order_index: 2 },
        { title: 'موفق', color: '#10B981', order_index: 3 },
        { title: 'از دست رفته', color: '#EF4444', order_index: 4 }
      ];

      await supabase
        .from('pipeline_stages')
        .insert(defaultStages.map(s => ({ ...s, pipeline_id: pipeline.id })));

      toast({ title: "موفق", description: "پایپ‌لاین ایجاد شد" });
      setShowCreateDialog(false);
      resetForm();
      fetchPipelines();
    } catch (error) {
      console.error('Error creating pipeline:', error);
      toast({ title: "خطا", description: "خطا در ایجاد پایپ‌لاین", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePipeline = async () => {
    if (!selectedPipeline || !formTitle.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('pipelines')
        .update({
          title: formTitle,
          description: formDescription || null,
          assigned_course_ids: formCourses,
          assigned_sales_agent_ids: formAgents
        })
        .eq('id', selectedPipeline.id);

      if (error) throw error;

      toast({ title: "موفق", description: "پایپ‌لاین بروزرسانی شد" });
      setShowEditDialog(false);
      resetForm();
      fetchPipelines();
    } catch (error) {
      console.error('Error updating pipeline:', error);
      toast({ title: "خطا", description: "خطا در بروزرسانی پایپ‌لاین", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePipeline = async (pipelineId: string) => {
    if (!confirm('آیا از حذف این پایپ‌لاین مطمئن هستید؟')) return;

    try {
      const { error } = await supabase
        .from('pipelines')
        .delete()
        .eq('id', pipelineId);

      if (error) throw error;

      toast({ title: "موفق", description: "پایپ‌لاین حذف شد" });
      fetchPipelines();
    } catch (error) {
      console.error('Error deleting pipeline:', error);
      toast({ title: "خطا", description: "خطا در حذف پایپ‌لاین", variant: "destructive" });
    }
  };

  const openEditDialog = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    setFormTitle(pipeline.title);
    setFormDescription(pipeline.description || '');
    setFormCourses(pipeline.assigned_course_ids || []);
    setFormAgents(pipeline.assigned_sales_agent_ids || []);
    setShowEditDialog(true);
  };

  const openStagesDialog = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
    setStages(pipeline.stages || []);
    setShowStagesDialog(true);
  };

  const handleAddStage = async () => {
    if (!selectedPipeline || !newStageName.trim()) return;

    setSaving(true);
    try {
      const newOrderIndex = stages.length;
      const { error } = await supabase
        .from('pipeline_stages')
        .insert({
          pipeline_id: selectedPipeline.id,
          title: newStageName,
          color: newStageColor,
          order_index: newOrderIndex
        });

      if (error) throw error;

      setNewStageName('');
      setNewStageColor(STAGE_COLORS[0]);
      
      // Refresh stages
      const { data } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', selectedPipeline.id)
        .order('order_index');
      
      setStages(data || []);
      fetchPipelines();
      toast({ title: "موفق", description: "مرحله اضافه شد" });
    } catch (error) {
      console.error('Error adding stage:', error);
      toast({ title: "خطا", description: "خطا در افزودن مرحله", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStage = async (stage: PipelineStage) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pipeline_stages')
        .update({ title: stage.title, color: stage.color })
        .eq('id', stage.id);

      if (error) throw error;

      // Update local stages state
      setStages(prevStages => 
        prevStages.map(s => s.id === stage.id ? { ...s, title: stage.title, color: stage.color } : s)
      );
      setEditingStage(null);
      fetchPipelines();
      toast({ title: "موفق", description: "مرحله بروزرسانی شد" });
    } catch (error) {
      console.error('Error updating stage:', error);
      toast({ title: "خطا", description: "خطا در بروزرسانی مرحله", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over.id);

      const newStages = arrayMove(stages, oldIndex, newIndex);
      
      // Update local state immediately for smooth UX
      setStages(newStages);

      // Update order_index in database
      try {
        const updates = newStages.map((stage, index) => 
          supabase
            .from('pipeline_stages')
            .update({ order_index: index })
            .eq('id', stage.id)
        );
        
        await Promise.all(updates);
        fetchPipelines();
        toast({ title: "موفق", description: "ترتیب مراحل بروزرسانی شد" });
      } catch (error) {
        console.error('Error reordering stages:', error);
        toast({ title: "خطا", description: "خطا در بروزرسانی ترتیب مراحل", variant: "destructive" });
      }
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm('آیا از حذف این مرحله مطمئن هستید؟')) return;

    try {
      const { error } = await supabase
        .from('pipeline_stages')
        .delete()
        .eq('id', stageId);

      if (error) throw error;

      setStages(stages.filter(s => s.id !== stageId));
      fetchPipelines();
      toast({ title: "موفق", description: "مرحله حذف شد" });
    } catch (error) {
      console.error('Error deleting stage:', error);
      toast({ title: "خطا", description: "خطا در حذف مرحله", variant: "destructive" });
    }
  };

  const toggleCourse = (courseId: string) => {
    setFormCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const toggleAgent = (agentId: number) => {
    setFormAgents(prev => 
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">مدیریت پایپ‌لاین فروش</h2>
          <p className="text-muted-foreground">ایجاد و مدیریت پایپ‌لاین‌های فروش</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          پایپ‌لاین جدید
        </Button>
      </div>

      {/* Pipelines List */}
      <div className="grid gap-4">
        {pipelines.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              هیچ پایپ‌لاینی وجود ندارد. یک پایپ‌لاین جدید ایجاد کنید.
            </CardContent>
          </Card>
        ) : (
          pipelines.map(pipeline => (
            <Card key={pipeline.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {pipeline.title}
                      {!pipeline.is_active && (
                        <Badge variant="secondary">غیرفعال</Badge>
                      )}
                    </CardTitle>
                    {pipeline.description && (
                      <p className="text-sm text-muted-foreground mt-1">{pipeline.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openStagesDialog(pipeline)}>
                      <Settings className="h-4 w-4 ml-1" />
                      مراحل
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(pipeline)}>
                      <Edit2 className="h-4 w-4 ml-1" />
                      ویرایش
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeletePipeline(pipeline.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Stages Preview */}
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">مراحل:</p>
                  <div className="flex flex-wrap gap-2">
                    {(pipeline.stages || []).map(stage => (
                      <Badge 
                        key={stage.id} 
                        style={{ backgroundColor: stage.color }}
                        className="text-white"
                      >
                        {stage.title}
                      </Badge>
                    ))}
                    {(!pipeline.stages || pipeline.stages.length === 0) && (
                      <span className="text-sm text-muted-foreground">بدون مرحله</span>
                    )}
                  </div>
                </div>

                {/* Assignments */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1 mb-1">
                      <BookOpen className="h-4 w-4" />
                      دوره‌ها:
                    </p>
                    <p className="font-medium">
                      {pipeline.assigned_course_ids?.length || 0} دوره
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1 mb-1">
                      <Users className="h-4 w-4" />
                      نمایندگان:
                    </p>
                    <p className="font-medium">
                      {pipeline.assigned_sales_agent_ids?.length || 0} نماینده
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Pipeline Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ایجاد پایپ‌لاین جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>عنوان پایپ‌لاین *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="مثال: پایپ‌لاین فروش دوره بدون مرز"
              />
            </div>
            <div>
              <Label>توضیحات</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="توضیحات اختیاری..."
                rows={3}
              />
            </div>
            <div>
              <Label>دوره‌های مرتبط</Label>
              <ScrollArea className="h-32 border rounded-md p-2 mt-1">
                {courses.map(course => (
                  <div key={course.id} className="flex items-center gap-2 py-1">
                    <Checkbox
                      checked={formCourses.includes(course.id)}
                      onCheckedChange={() => toggleCourse(course.id)}
                    />
                    <span className="text-sm">{course.title}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
            <div>
              <Label>نمایندگان فروش</Label>
              <ScrollArea className="h-32 border rounded-md p-2 mt-1">
                {agents.map(agent => (
                  <div key={agent.id} className="flex items-center gap-2 py-1">
                    <Checkbox
                      checked={formAgents.includes(agent.id)}
                      onCheckedChange={() => toggleAgent(agent.id)}
                    />
                    <span className="text-sm">{agent.name} - {agent.phone}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>انصراف</Button>
            <Button onClick={handleCreatePipeline} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              ایجاد پایپ‌لاین
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Pipeline Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>ویرایش پایپ‌لاین</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>عنوان پایپ‌لاین *</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>توضیحات</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label>دوره‌های مرتبط</Label>
              <ScrollArea className="h-32 border rounded-md p-2 mt-1">
                {courses.map(course => (
                  <div key={course.id} className="flex items-center gap-2 py-1">
                    <Checkbox
                      checked={formCourses.includes(course.id)}
                      onCheckedChange={() => toggleCourse(course.id)}
                    />
                    <span className="text-sm">{course.title}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
            <div>
              <Label>نمایندگان فروش</Label>
              <ScrollArea className="h-32 border rounded-md p-2 mt-1">
                {agents.map(agent => (
                  <div key={agent.id} className="flex items-center gap-2 py-1">
                    <Checkbox
                      checked={formAgents.includes(agent.id)}
                      onCheckedChange={() => toggleAgent(agent.id)}
                    />
                    <span className="text-sm">{agent.name} - {agent.phone}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>انصراف</Button>
            <Button onClick={handleUpdatePipeline} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stages Management Dialog */}
      <Dialog open={showStagesDialog} onOpenChange={setShowStagesDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>مدیریت مراحل - {selectedPipeline?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Existing Stages */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={stages.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {stages.map((stage, index) => (
                    <SortableStageItem
                      key={stage.id}
                      stage={stage}
                      index={index}
                      editingStage={editingStage}
                      setEditingStage={setEditingStage}
                      handleUpdateStage={handleUpdateStage}
                      handleDeleteStage={handleDeleteStage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add New Stage */}
            <div className="flex items-center gap-2 p-2 border rounded-md border-dashed">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <Input
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="نام مرحله جدید..."
                className="flex-1 h-8"
              />
              <select
                value={newStageColor}
                onChange={(e) => setNewStageColor(e.target.value)}
                className="h-8 border rounded px-2 bg-background"
              >
                {STAGE_COLORS.map(color => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={handleAddStage} disabled={!newStageName.trim() || saving}>
                افزودن
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStagesDialog(false)}>بستن</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PipelineBuilder;
