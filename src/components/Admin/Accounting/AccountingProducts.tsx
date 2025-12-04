import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  type: string;
  price: number;
  is_active: boolean;
  course_id: string | null;
  created_at: string;
}

export const AccountingProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'service',
    price: '',
    is_active: true
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data as Product[]) || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('خطا در دریافت محصولات');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast.error('لطفا نام و قیمت را وارد کنید');
      return;
    }

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            name: formData.name,
            description: formData.description || null,
            type: formData.type,
            price: parseFloat(formData.price),
            is_active: formData.is_active
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('محصول با موفقیت ویرایش شد');
      } else {
        const { error } = await supabase
          .from('products')
          .insert({
            name: formData.name,
            description: formData.description || null,
            type: formData.type,
            price: parseFloat(formData.price),
            is_active: formData.is_active
          });

        if (error) throw error;
        toast.success('محصول با موفقیت اضافه شد');
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', type: 'service', price: '', is_active: true });
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('خطا در ذخیره محصول');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      type: product.type,
      price: product.price.toString(),
      is_active: product.is_active
    });
    setIsDialogOpen(true);
  };

  const toggleActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error('Error toggling product:', error);
      toast.error('خطا در تغییر وضعیت');
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'course':
        return <Badge className="bg-blue-500">دوره آموزشی</Badge>;
      case 'service':
        return <Badge className="bg-green-500">خدمات</Badge>;
      case 'physical':
        return <Badge className="bg-purple-500">فیزیکی</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مدیریت محصولات و خدمات</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
            setFormData({ name: '', description: '', type: 'service', price: '', is_active: true });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" />
              محصول جدید
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'ویرایش محصول' : 'افزودن محصول جدید'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>نام محصول</Label>
                <Input 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="مثلا: سیم کارت بین‌المللی"
                />
              </div>
              <div>
                <Label>توضیحات</Label>
                <Textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div>
                <Label>نوع</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">خدمات</SelectItem>
                    <SelectItem value="physical">فیزیکی</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>قیمت (تومان)</Label>
                <Input 
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.is_active}
                  onCheckedChange={v => setFormData({...formData, is_active: v})}
                />
                <Label>فعال</Label>
              </div>
              <Button className="w-full" onClick={handleSubmit}>
                {editingProduct ? 'ذخیره تغییرات' : 'افزودن محصول'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Package className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-muted-foreground">کل محصولات</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">
              {products.filter(p => p.is_active).length}
            </div>
            <p className="text-muted-foreground">فعال</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-500">
              {products.filter(p => !p.is_active).length}
            </div>
            <p className="text-muted-foreground">غیرفعال</p>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>نوع</TableHead>
                <TableHead>قیمت</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    در حال بارگذاری...
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    محصولی یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                products.map(product => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {product.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getTypeBadge(product.type)}</TableCell>
                    <TableCell>{Number(product.price).toLocaleString()} تومان</TableCell>
                    <TableCell>
                      <Switch 
                        checked={product.is_active}
                        onCheckedChange={() => toggleActive(product)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountingProducts;
