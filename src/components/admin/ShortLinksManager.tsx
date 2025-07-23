import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Trash2, Edit, Plus, Link as LinkIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  createShortLink,
  getAllShortLinks,
  updateShortLink,
  deleteShortLink,
  getNextShortCode,
  type ShortLink,
} from "@/lib/urlShortener";

const ShortLinksManager: React.FC = () => {
  const [shortLinks, setShortLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ShortLink | null>(null);
  const [formData, setFormData] = useState({
    original_url: '',
    slug: '',
    use_custom_slug: false,
  });

  useEffect(() => {
    loadShortLinks();
  }, []);

  const loadShortLinks = async () => {
    setLoading(true);
    const links = await getAllShortLinks();
    setShortLinks(links);
    setLoading(false);
  };

  const handleCreateLink = async () => {
    console.log('Creating link with data:', formData);
    
    if (!formData.original_url.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً URL اصلی را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(formData.original_url);
      console.log('URL validation passed');
    } catch {
      console.log('URL validation failed');
      toast({
        title: "خطا",
        description: "فرمت URL صحیح نیست",
        variant: "destructive",
      });
      return;
    }

    const slug = formData.use_custom_slug && formData.slug.trim() 
      ? formData.slug.trim() 
      : undefined;

    console.log('Calling createShortLink with:', {
      original_url: formData.original_url,
      slug,
      created_by: 'admin'
    });

    const result = await createShortLink({
      original_url: formData.original_url,
      slug,
      created_by: 'admin',
    });

    console.log('createShortLink result:', result);

    if (result) {
      toast({
        title: "موفقیت",
        description: "لینک کوتاه با موفقیت ایجاد شد",
      });
      setFormData({ original_url: '', slug: '', use_custom_slug: false });
      setCreateDialogOpen(false);
      loadShortLinks();
    } else {
      toast({
        title: "خطا",
        description: "خطا در ایجاد لینک کوتاه",
        variant: "destructive",
      });
    }
  };

  const handleEditLink = async () => {
    if (!editingLink || !formData.original_url.trim()) {
      return;
    }

    try {
      new URL(formData.original_url);
    } catch {
      toast({
        title: "خطا",
        description: "فرمت URL صحیح نیست",
        variant: "destructive",
      });
      return;
    }

    const result = await updateShortLink(editingLink.id, {
      original_url: formData.original_url,
      slug: formData.use_custom_slug && formData.slug.trim() 
        ? formData.slug.trim() 
        : editingLink.slug,
    });

    if (result) {
      toast({
        title: "موفقیت",
        description: "لینک با موفقیت ویرایش شد",
      });
      setEditDialogOpen(false);
      setEditingLink(null);
      loadShortLinks();
    } else {
      toast({
        title: "خطا",
        description: "خطا در ویرایش لینک",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLink = async (id: string) => {
    const success = await deleteShortLink(id);
    if (success) {
      toast({
        title: "موفقیت",
        description: "لینک با موفقیت حذف شد",
      });
      loadShortLinks();
    } else {
      toast({
        title: "خطا",
        description: "خطا در حذف لینک",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "کپی شد",
      description: "لینک در کلیپ‌بورد کپی شد",
    });
  };

  const getShortUrl = (slug: string) => `https://l.rafiei.co/${slug}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const openEditDialog = (link: ShortLink) => {
    setEditingLink(link);
    setFormData({
      original_url: link.original_url,
      slug: link.slug,
      use_custom_slug: true,
    });
    setEditDialogOpen(true);
  };

  const generateNextSlug = async () => {
    const nextSlug = await getNextShortCode();
    setFormData(prev => ({ ...prev, slug: nextSlug }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            مدیریت لینک‌های کوتاه
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">در حال بارگذاری...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          مدیریت لینک‌های کوتاه
        </CardTitle>
        <CardDescription>
          ایجاد و مدیریت لینک‌های کوتاه برای l.rafiei.co
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create New Link Button */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              ایجاد لینک کوتاه جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>ایجاد لینک کوتاه جدید</DialogTitle>
              <DialogDescription>
                لینک مورد نظر خود را وارد کرده و کد کوتاه دریافت کنید
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="original_url">URL اصلی</Label>
                <Input
                  id="original_url"
                  placeholder="https://example.com"
                  value={formData.original_url}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    original_url: e.target.value 
                  }))}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="use_custom_slug"
                  checked={formData.use_custom_slug}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    use_custom_slug: e.target.checked 
                  }))}
                />
                <Label htmlFor="use_custom_slug">استفاده از کد دلخواه</Label>
              </div>

              {formData.use_custom_slug && (
                <div>
                  <Label htmlFor="custom_slug">کد کوتاه (اختیاری)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom_slug"
                      placeholder="abc"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        slug: e.target.value 
                      }))}
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={generateNextSlug}
                      size="sm"
                    >
                      تولید خودکار
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleCreateLink} className="flex-1">
                  ایجاد لینک
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                  className="flex-1"
                >
                  انصراف
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>ویرایش لینک کوتاه</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_original_url">URL اصلی</Label>
                <Input
                  id="edit_original_url"
                  value={formData.original_url}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    original_url: e.target.value 
                  }))}
                />
              </div>
              
              <div>
                <Label htmlFor="edit_slug">کد کوتاه</Label>
                <Input
                  id="edit_slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    slug: e.target.value 
                  }))}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleEditLink} className="flex-1">
                  ذخیره تغییرات
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                  className="flex-1"
                >
                  انصراف
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Links Table */}
        {shortLinks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            هنوز لینک کوتاهی ایجاد نشده است
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کد کوتاه</TableHead>
                  <TableHead>URL اصلی</TableHead>
                  <TableHead>کلیک‌ها</TableHead>
                  <TableHead>تاریخ ایجاد</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shortLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{link.slug}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(getShortUrl(link.slug))}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {link.original_url}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{link.clicks}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(link.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getShortUrl(link.slug), '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(getShortUrl(link.slug))}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(link)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف لینک کوتاه</AlertDialogTitle>
                              <AlertDialogDescription>
                                آیا مطمئن هستید که می‌خواهید این لینک کوتاه را حذف کنید؟
                                این عمل قابل بازگشت نیست.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>انصراف</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteLink(link.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShortLinksManager;