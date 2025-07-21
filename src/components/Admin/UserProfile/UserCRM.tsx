import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Phone, FileText, Trash2, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CRMNote {
  id: string;
  type: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface UserCRMProps {
  userId: number;
}

export function UserCRM({ userId }: UserCRMProps) {
  const [notes, setNotes] = useState<CRMNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({ type: 'note', content: '' });
  const [filterType, setFilterType] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('crm_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching CRM notes:', error);
      toast({
        title: "Error",
        description: "Failed to load CRM notes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.content.trim()) return;

    try {
      const { error } = await supabase
        .from('crm_notes')
        .insert({
          user_id: userId,
          type: newNote.type,
          content: newNote.content,
          created_by: 'Admin' // You might want to get this from current user context
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "CRM note added successfully."
      });

      setNewNote({ type: 'note', content: '' });
      setIsAddingNote(false);
      fetchNotes();
    } catch (error) {
      console.error('Error adding CRM note:', error);
      toast({
        title: "Error",
        description: "Failed to add CRM note.",
        variant: "destructive"
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('crm_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "CRM note deleted successfully."
      });

      fetchNotes();
    } catch (error) {
      console.error('Error deleting CRM note:', error);
      toast({
        title: "Error",
        description: "Failed to delete CRM note.",
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      note: 'default',
      call: 'secondary',
      message: 'outline'
    };
    return <Badge variant={variants[type] || 'default'}>{type.toUpperCase()}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotes = filterType === 'all' 
    ? notes 
    : notes.filter(note => note.type === filterType);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            CRM Activity ({filteredNotes.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="note">Notes</SelectItem>
                <SelectItem value="call">Calls</SelectItem>
                <SelectItem value="message">Messages</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add CRM Note</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={newNote.type} onValueChange={(value) => setNewNote({...newNote, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="note">Note</SelectItem>
                        <SelectItem value="call">Call Log</SelectItem>
                        <SelectItem value="message">Message</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Enter your note content..."
                      value={newNote.content}
                      onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addNote}>
                      Add Note
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No CRM activities found.
            {filterType !== 'all' && (
              <p className="mt-2">
                Try changing the filter or{' '}
                <Button variant="link" onClick={() => setFilterType('all')} className="p-0 h-auto">
                  view all activities
                </Button>
              </p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNotes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(note.type)}
                      {getTypeBadge(note.type)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="text-sm leading-relaxed">{note.content}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{note.created_by}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(note.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNote(note.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}