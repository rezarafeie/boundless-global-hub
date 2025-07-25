import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, Edit, Eye, Copy, Trash2, FileText, Code } from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  course_id: string | null;
  sender_name: string;
  sender_email: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  courses?: { title: string };
}

interface Course {
  id: string;
  title: string;
}

const EmailTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    course_id: '',
    sender_name: 'Academy Rafiei',
    sender_email: 'academyrafeie@gmail.com',
    subject: '',
    html_content: '',
    text_content: '',
    is_active: true,
    is_default: false,
  });

  useEffect(() => {
    fetchTemplates();
    fetchCourses();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select(`
          *,
          courses (title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: "خطا",
        description: `Failed to fetch templates: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleSave = async () => {
    try {
      console.log('Starting save process...', { selectedTemplate, formData });
      
      if (!formData.name || !formData.subject || !formData.html_content) {
        toast({
          title: "خطا",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      const templateData = {
        ...formData,
        course_id: formData.course_id === 'null' || formData.course_id === '' ? null : formData.course_id,
      };

      console.log('Template data to save:', templateData);

      let result;
      if (selectedTemplate) {
        // Update existing template
        console.log('Updating template with ID:', selectedTemplate.id);
        result = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', selectedTemplate.id)
          .select();
      } else {
        // Create new template
        console.log('Creating new template');
        result = await supabase
          .from('email_templates')
          .insert(templateData)
          .select();
      }

      console.log('Save result:', result);

      if (result.error) {
        console.error('Save error:', result.error);
        throw result.error;
      }

      toast({
        title: "موفق",
        description: selectedTemplate ? "Template updated successfully" : "Template created successfully",
      });

      setIsDialogOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error: any) {
      console.error('Save failed:', error);
      toast({
        title: "خطا",
        description: `Failed to save template: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      course_id: template.course_id || 'null',
      sender_name: template.sender_name,
      sender_email: template.sender_email,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content || '',
      is_active: template.is_active,
      is_default: template.is_default,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;

      toast({
        title: "موفق",
        description: "Template deleted successfully",
      });

      fetchTemplates();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: `Failed to delete template: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      course_id: '',
      sender_name: 'Academy Rafiei',
      sender_email: 'academyrafeie@gmail.com',
      subject: '',
      html_content: '',
      text_content: '',
      is_active: true,
      is_default: false,
    });
  };

  const availableVariables = [
    '{{user_name}}', '{{user_email}}', '{{user_phone}}',
    '{{course_title}}', '{{course_description}}', '{{course_redirect_url}}',
    '{{enrollment_date}}', '{{payment_amount}}', '{{payment_status}}',
    '{{spotplayer_license_key}}', '{{spotplayer_license_url}}', '{{spotplayer_license_id}}'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Email Templates
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedTemplate ? 'Edit Email Template' : 'Create Email Template'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Course Enrollment Confirmation"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="course">Course (Optional)</Label>
                    <Select
                      value={formData.course_id}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        course_id: value === 'null' ? '' : value 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course (default for all)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Default for all courses</SelectItem>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sender_name">Sender Name</Label>
                    <Input
                      id="sender_name"
                      value={formData.sender_name}
                      onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sender_email">Sender Email</Label>
                    <Input
                      id="sender_email"
                      value={formData.sender_email}
                      onChange={(e) => setFormData({ ...formData, sender_email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Email Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g., تایید ثبت‌نام در دوره {{course_title}}"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Available Variables</Label>
                    <div className="text-xs text-gray-500">Click to copy</div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {availableVariables.map((variable) => (
                      <Badge
                        key={variable}
                        variant="outline"
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          navigator.clipboard.writeText(variable);
                          toast({ title: "Copied!", description: `${variable} copied to clipboard` });
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="html_content">HTML Content *</Label>
                  <Textarea
                    id="html_content"
                    value={formData.html_content}
                    onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                    rows={12}
                    placeholder="Enter HTML email template..."
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text_content">Text Content (Fallback)</Label>
                  <Textarea
                    id="text_content"
                    value={formData.text_content}
                    onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
                    rows={6}
                    placeholder="Enter plain text email template..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_default"
                      checked={formData.is_default}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                    />
                    <Label htmlFor="is_default">Default Template</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    {selectedTemplate ? 'Update Template' : 'Create Template'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading templates...
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No templates found
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-gray-500">
                          {template.sender_name} &lt;{template.sender_email}&gt;
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.courses?.title || (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {template.subject}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={template.is_active ? "default" : "secondary"}>
                          {template.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {template.is_default && (
                          <Badge variant="outline">Default</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTemplateManager;