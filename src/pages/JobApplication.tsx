import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Briefcase, Send, Users, Sparkles } from "lucide-react";

const jobPositions = [
  { value: "sales", label: "کارشناس فروش تلفنی" },
  { value: "support", label: "کارشناس پشتیبانی آموزشی" },
  { value: "project_manager", label: "دستیار و مدیر پروژه" },
  { value: "content_creator", label: "تولید کننده محتوا" },
  { value: "video_editor", label: "تدوینگر" },
  { value: "graphic_designer", label: "گرافیست" },
  { value: "developer", label: "برنامه نویس" },
  { value: "admin_staff", label: "نیروی اداری" },
  { value: "advertising", label: "کارشناس تبلیغات" },
  { value: "digital_marketing", label: "دیجیتال مارکتر" },
  { value: "public_relations", label: "کارشناس روابط عمومی" },
  { value: "other", label: "سایر فرصت های شغلی" },
];

const workTypes = [
  { value: "remote", label: "دورکاری" },
  { value: "hybrid", label: "ترکیبی" },
  { value: "onsite", label: "حضوری" },
];

export default function JobApplication() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    age: "",
    desired_position: "",
    city: "",
    work_type: "",
    self_introduction: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("job_applications").insert([
        {
          full_name: formData.full_name,
          phone: formData.phone,
          age: parseInt(formData.age),
          desired_position: formData.desired_position,
          city: formData.city,
          work_type: formData.work_type,
          self_introduction: formData.self_introduction,
        },
      ]);

      if (error) throw error;

      toast.success("درخواست شما با موفقیت ثبت شد!");
      setFormData({
        full_name: "",
        phone: "",
        age: "",
        desired_position: "",
        city: "",
        work_type: "",
        self_introduction: "",
      });
      
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error("خطا در ثبت درخواست. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5" dir="rtl">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-background/10 rounded-full mb-6 backdrop-blur-sm">
            <Briefcase className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            به تیم آکادمی رفیعی بپیوندید
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            در کنار ما، آینده‌ای روشن و موفق برای خود بسازید
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">محیط کاری حرفه‌ای</h3>
            <p className="text-muted-foreground text-sm">
              با تیمی متخصص و با انگیزه همکاری کنید
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">رشد و توسعه</h3>
            <p className="text-muted-foreground text-sm">
              فرصت یادگیری و پیشرفت مهارت‌های خود
            </p>
          </div>
          <div className="bg-card p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">انعطاف‌پذیری</h3>
            <p className="text-muted-foreground text-sm">
              امکان کار دورکاری، حضوری یا ترکیبی
            </p>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-card rounded-xl shadow-lg border p-8 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">فرم درخواست همکاری</h2>
            <p className="text-muted-foreground">
              اطلاعات خود را با دقت وارد کنید
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">
                  نام و نام خانوادگی <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="full_name"
                  placeholder="نام کامل خود را وارد کنید"
                  value={formData.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  required
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  شماره تماس <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="09123456789"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  required
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">
                  سن <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="سن خود را وارد کنید"
                  value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  required
                  min="18"
                  max="65"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">
                  شهر محل سکونت <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  placeholder="مثال: تهران"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  required
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="desired_position">
                  موقعیت شغلی مورد نظر <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.desired_position}
                  onValueChange={(value) =>
                    handleChange("desired_position", value)
                  }
                  required
                >
                  <SelectTrigger id="desired_position">
                    <SelectValue placeholder="انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobPositions.map((position) => (
                      <SelectItem key={position.value} value={position.value}>
                        {position.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="work_type">
                  نوع همکاری <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.work_type}
                  onValueChange={(value) => handleChange("work_type", value)}
                  required
                >
                  <SelectTrigger id="work_type">
                    <SelectValue placeholder="انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    {workTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="self_introduction">
                معرفی کوتاه از خود و توضیح تجربیات
              </Label>
              <Textarea
                id="self_introduction"
                placeholder="لطفاً در مورد خود، مهارت‌ها و تجربیات کاری خود بنویسید..."
                value={formData.self_introduction}
                onChange={(e) =>
                  handleChange("self_introduction", e.target.value)
                }
                rows={5}
                className="resize-none text-right"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "در حال ارسال..."
              ) : (
                <>
                  <Send className="ml-2 h-5 w-5" />
                  ارسال درخواست
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="text-center mt-12 text-muted-foreground">
          <p>
            با ارسال این فرم، اطلاعات شما توسط تیم منابع انسانی بررسی می‌شود و در
            صورت تایید با شما تماس گرفته خواهد شد.
          </p>
        </div>
      </div>
    </div>
  );
}
