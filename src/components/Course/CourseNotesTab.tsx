import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Trash2, X, Save } from "lucide-react";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

interface Props { courseId: string }

const storageKey = (courseId: string) => `course-notes:${courseId}`;

export const CourseNotesTab: React.FC<Props> = ({ courseId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState<Note | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(courseId));
      setNotes(raw ? JSON.parse(raw) : []);
    } catch {
      setNotes([]);
    }
  }, [courseId]);

  const persist = (next: Note[]) => {
    setNotes(next);
    localStorage.setItem(storageKey(courseId), JSON.stringify(next));
  };

  const startNew = () => {
    setEditing({ id: crypto.randomUUID(), title: "", content: "", updatedAt: Date.now() });
  };

  const save = () => {
    if (!editing) return;
    if (!editing.title.trim() && !editing.content.trim()) {
      toast.error("یادداشت خالی است");
      return;
    }
    const exists = notes.find((n) => n.id === editing.id);
    const next = exists
      ? notes.map((n) => (n.id === editing.id ? { ...editing, updatedAt: Date.now() } : n))
      : [{ ...editing, updatedAt: Date.now() }, ...notes];
    persist(next);
    setEditing(null);
    toast.success("یادداشت ذخیره شد");
  };

  const remove = (id: string) => {
    persist(notes.filter((n) => n.id !== id));
    toast.success("یادداشت حذف شد");
  };

  if (editing) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">یادداشت جدید</h3>
            <Button size="icon" variant="ghost" onClick={() => setEditing(null)}>
              <X size={16} />
            </Button>
          </div>
          <Input
            placeholder="عنوان یادداشت"
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
          />
          <Textarea
            placeholder="متن یادداشت..."
            rows={8}
            value={editing.content}
            onChange={(e) => setEditing({ ...editing, content: e.target.value })}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditing(null)}>انصراف</Button>
            <Button onClick={save}>
              <Save className="h-4 w-4 ml-2" />
              ذخیره
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Button onClick={startNew} className="w-full" variant="outline">
        <Plus className="h-4 w-4 ml-2" />
        افزودن یادداشت جدید
      </Button>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">هنوز یادداشتی ثبت نکرده‌اید</p>
          </CardContent>
        </Card>
      ) : (
        notes.map((n) => (
          <Card key={n.id} className="cursor-pointer hover:bg-accent/40 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0" onClick={() => setEditing(n)}>
                  <p className="font-medium text-sm truncate">{n.title || "بدون عنوان"}</p>
                  {n.content && (
                    <p className="text-xs text-muted-foreground line-clamp-3 mt-1 whitespace-pre-wrap">
                      {n.content}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {new Date(n.updatedAt).toLocaleDateString("fa-IR")}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(n.id)}>
                  <Trash2 size={16} className="text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default CourseNotesTab;
