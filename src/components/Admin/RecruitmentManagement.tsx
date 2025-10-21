import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Search,
  Eye,
  FileText,
  Filter,
  Download,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface JobApplication {
  id: string;
  full_name: string;
  phone: string;
  age: number;
  desired_position: string;
  city: string;
  work_type: string;
  self_introduction: string;
  status: string;
  assigned_manager: number | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<string, string> = {
  new: "جدید",
  interviewed: "مصاحبه شده",
  hired: "استخدام شده",
  rejected: "رد شده",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  interviewed: "bg-yellow-500",
  hired: "bg-green-500",
  rejected: "bg-red-500",
};

const positionLabels: Record<string, string> = {
  sales: "کارشناس فروش تلفنی",
  support: "کارشناس پشتیبانی آموزشی",
  project_manager: "دستیار و مدیر پروژه",
  content_creator: "تولید کننده محتوا",
  video_editor: "تدوینگر",
  graphic_designer: "گرافیست",
  developer: "برنامه نویس",
  admin_staff: "نیروی اداری",
  advertising: "کارشناس تبلیغات",
  digital_marketing: "دیجیتال مارکتر",
  public_relations: "کارشناس روابط عمومی",
  other: "سایر",
};

const workTypeLabels: Record<string, string> = {
  remote: "دورکاری",
  hybrid: "ترکیبی",
  onsite: "حضوری",
};

export default function RecruitmentManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] =
    useState<JobApplication | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ["job-applications", statusFilter, positionFilter],
    queryFn: async () => {
      let query = supabase
        .from("job_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (positionFilter !== "all") {
        query = query.eq("desired_position", positionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as JobApplication[];
    },
  });

  // Update application mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<JobApplication>;
    }) => {
      const { error } = await supabase
        .from("job_applications")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
      toast.success("اطلاعات با موفقیت به‌روزرسانی شد");
    },
    onError: () => {
      toast.error("خطا در به‌روزرسانی اطلاعات");
    },
  });

  const filteredApplications = applications?.filter((app) =>
    app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.phone.includes(searchTerm) ||
    app.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    if (!filteredApplications) return;

    const headers = [
      "نام و نام خانوادگی",
      "شماره تماس",
      "سن",
      "موقعیت شغلی",
      "شهر",
      "نوع همکاری",
      "وضعیت",
      "تاریخ ثبت",
    ];

    const rows = filteredApplications.map((app) => [
      app.full_name,
      app.phone,
      app.age,
      positionLabels[app.desired_position],
      app.city,
      workTypeLabels[app.work_type],
      statusLabels[app.status],
      format(new Date(app.created_at), "yyyy/MM/dd HH:mm"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `job-applications-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    toast.success("فایل CSV با موفقیت دانلود شد");
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">مدیریت استخدام</h2>
          <p className="text-muted-foreground mt-1">
            مشاهده و مدیریت درخواست‌های همکاری
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="ml-2 h-4 w-4" />
          خروجی CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="جستجو بر اساس نام، شماره یا شهر..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Filter className="ml-2 h-4 w-4" />
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="new">جدید</SelectItem>
            <SelectItem value="interviewed">مصاحبه شده</SelectItem>
            <SelectItem value="hired">استخدام شده</SelectItem>
            <SelectItem value="rejected">رد شده</SelectItem>
          </SelectContent>
        </Select>
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <FileText className="ml-2 h-4 w-4" />
            <SelectValue placeholder="موقعیت شغلی" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه موقعیت‌ها</SelectItem>
            {Object.entries(positionLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div
            key={status}
            className="bg-card p-4 rounded-lg border shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">
                  {applications?.filter((app) => app.status === status).length || 0}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Applications Table */}
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            در حال بارگذاری...
          </div>
        ) : !filteredApplications?.length ? (
          <div className="p-8 text-center text-muted-foreground">
            درخواستی یافت نشد
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام و نام خانوادگی</TableHead>
                <TableHead>شماره تماس</TableHead>
                <TableHead>موقعیت شغلی</TableHead>
                <TableHead>شهر</TableHead>
                <TableHead>نوع همکاری</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تاریخ ثبت</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.full_name}</TableCell>
                  <TableCell>{app.phone}</TableCell>
                  <TableCell>{positionLabels[app.desired_position]}</TableCell>
                  <TableCell>{app.city}</TableCell>
                  <TableCell>{workTypeLabels[app.work_type]}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusColors[app.status]}
                    >
                      {statusLabels[app.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(app.created_at), "yyyy/MM/dd")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedApplication(app);
                        setIsDetailsOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 ml-2" />
                      جزئیات
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>جزئیات درخواست</DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نام و نام خانوادگی</Label>
                  <p className="text-sm font-medium mt-1">
                    {selectedApplication.full_name}
                  </p>
                </div>
                <div>
                  <Label>شماره تماس</Label>
                  <p className="text-sm font-medium mt-1">
                    {selectedApplication.phone}
                  </p>
                </div>
                <div>
                  <Label>سن</Label>
                  <p className="text-sm font-medium mt-1">
                    {selectedApplication.age} سال
                  </p>
                </div>
                <div>
                  <Label>شهر</Label>
                  <p className="text-sm font-medium mt-1">
                    {selectedApplication.city}
                  </p>
                </div>
                <div>
                  <Label>موقعیت شغلی</Label>
                  <p className="text-sm font-medium mt-1">
                    {positionLabels[selectedApplication.desired_position]}
                  </p>
                </div>
                <div>
                  <Label>نوع همکاری</Label>
                  <p className="text-sm font-medium mt-1">
                    {workTypeLabels[selectedApplication.work_type]}
                  </p>
                </div>
              </div>

              {selectedApplication.self_introduction && (
                <div>
                  <Label>معرفی متقاضی</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg text-sm">
                    {selectedApplication.self_introduction}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">وضعیت درخواست</Label>
                <Select
                  value={selectedApplication.status}
                  onValueChange={(value) => {
                    updateMutation.mutate({
                      id: selectedApplication.id,
                      updates: { status: value },
                    });
                    setSelectedApplication({
                      ...selectedApplication,
                      status: value,
                    });
                  }}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_notes">یادداشت‌های مدیر</Label>
                <Textarea
                  id="admin_notes"
                  placeholder="یادداشت‌های خود را اینجا وارد کنید..."
                  value={selectedApplication.admin_notes || ""}
                  onChange={(e) =>
                    setSelectedApplication({
                      ...selectedApplication,
                      admin_notes: e.target.value,
                    })
                  }
                  rows={4}
                />
                <Button
                  onClick={() =>
                    updateMutation.mutate({
                      id: selectedApplication.id,
                      updates: { admin_notes: selectedApplication.admin_notes },
                    })
                  }
                  disabled={updateMutation.isPending}
                >
                  ذخیره یادداشت
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
