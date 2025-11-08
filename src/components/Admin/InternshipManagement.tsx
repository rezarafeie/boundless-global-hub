import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, Eye, Filter } from "lucide-react";

interface InternshipApplication {
  id: string;
  full_name: string;
  phone: string;
  age: number;
  city: string;
  specialization: string | null;
  desired_department: string;
  availability: string;
  self_introduction: string | null;
  status: string;
  assigned_mentor: number | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<string, string> = {
  new: "جدید",
  contacted: "تماس گرفته شده",
  interviewed: "مصاحبه شده",
  accepted: "پذیرفته شده",
  rejected: "رد شده",
  completed: "تکمیل شده",
  no_answer: "پاسخ نداد",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  interviewed: "bg-purple-500",
  accepted: "bg-green-500",
  rejected: "bg-red-500",
  completed: "bg-gray-500",
  no_answer: "bg-orange-500",
};

const departmentLabels: Record<string, string> = {
  sales_marketing: "Sales & Marketing",
  content_media: "Content & Media",
  education_support: "Education & Support",
  ai_development: "AI & Development",
  graphic_video: "Graphic & Video Production",
  administration: "Administration",
  other: "Other",
};

const availabilityLabels: Record<string, string> = {
  full_time: "تمام وقت",
  part_time: "پاره وقت",
  flexible: "انعطاف‌پذیر",
};

export default function InternshipManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<InternshipApplication | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["internship-applications", statusFilter, departmentFilter],
    queryFn: async () => {
      let query = supabase
        .from("internship_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (departmentFilter !== "all") {
        query = query.eq("desired_department", departmentFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InternshipApplication[];
    },
  });

  // Update application mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InternshipApplication> }) => {
      const { error } = await supabase
        .from("internship_applications")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internship-applications"] });
      toast.success("اطلاعات با موفقیت به‌روزرسانی شد");
      setIsDialogOpen(false);
    },
    onError: () => {
      toast.error("خطا در به‌روزرسانی اطلاعات");
    },
  });

  // Get unique cities for filter
  const uniqueCities = Array.from(new Set(applications.map(app => app.city))).sort();

  // Filter applications based on search and filters
  const filteredApplications = applications.filter((app) => {
    const matchesSearch = app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.phone.includes(searchTerm) ||
      app.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAvailability = availabilityFilter === "all" || app.availability === availabilityFilter;
    const matchesCity = cityFilter === "all" || app.city === cityFilter;
    const matchesMinAge = !minAge || app.age >= parseInt(minAge);
    const matchesMaxAge = !maxAge || app.age <= parseInt(maxAge);

    return matchesSearch && matchesAvailability && matchesCity && matchesMinAge && matchesMaxAge;
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "نام",
      "شماره تماس",
      "سن",
      "شهر",
      "تخصص",
      "دپارتمان",
      "در دسترس بودن",
      "وضعیت",
      "تاریخ ثبت",
    ];

    const rows = filteredApplications.map((app) => [
      app.full_name,
      app.phone,
      app.age,
      app.city,
      app.specialization || "-",
      departmentLabels[app.desired_department] || app.desired_department,
      availabilityLabels[app.availability] || app.availability,
      statusLabels[app.status] || app.status,
      new Date(app.created_at).toLocaleDateString("fa-IR"),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `internship_applications_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Stats by status
  const stats = Object.keys(statusLabels).map((status) => ({
    label: statusLabels[status],
    count: applications.filter((app) => app.status === status).length,
    color: statusColors[status],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">مدیریت کارآموزی‌ها</h2>
          <p className="text-muted-foreground mt-1">مشاهده و مدیریت درخواست‌های کارآموزی</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="ml-2 h-4 w-4" />
          خروجی CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border rounded-lg p-4">
            <div className={`w-3 h-3 rounded-full ${stat.color} mb-2`}></div>
            <div className="text-2xl font-bold">{stat.count}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">
            تعداد رکوردهای فیلتر شده: <span className="font-bold text-foreground">{filteredApplications.length}</span> از {applications.length}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="جستجو بر اساس نام، شماره تماس یا شهر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="فیلتر وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="فیلتر دپارتمان" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه دپارتمان‌ها</SelectItem>
              {Object.entries(departmentLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="در دسترس بودن" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              {Object.entries(availabilityLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="شهر" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه شهرها</SelectItem>
              {uniqueCities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2 flex-1">
            <Input
              type="number"
              placeholder="حداقل سن"
              value={minAge}
              onChange={(e) => setMinAge(e.target.value)}
              className="w-full"
            />
            <Input
              type="number"
              placeholder="حداکثر سن"
              value={maxAge}
              onChange={(e) => setMaxAge(e.target.value)}
              className="w-full"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setDepartmentFilter("all");
              setAvailabilityFilter("all");
              setCityFilter("all");
              setMinAge("");
              setMaxAge("");
            }}
          >
            پاک کردن فیلترها
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>نام</TableHead>
              <TableHead>شماره تماس</TableHead>
              <TableHead>سن</TableHead>
              <TableHead>شهر</TableHead>
              <TableHead>دپارتمان</TableHead>
              <TableHead>در دسترس بودن</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>تاریخ ثبت</TableHead>
              <TableHead>عملیات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  در حال بارگذاری...
                </TableCell>
              </TableRow>
            ) : filteredApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  هیچ درخواستی یافت نشد
                </TableCell>
              </TableRow>
            ) : (
              filteredApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.full_name}</TableCell>
                  <TableCell>{app.phone}</TableCell>
                  <TableCell>{app.age}</TableCell>
                  <TableCell>{app.city}</TableCell>
                  <TableCell>{departmentLabels[app.desired_department] || app.desired_department}</TableCell>
                  <TableCell>{availabilityLabels[app.availability] || app.availability}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[app.status]}>
                      {statusLabels[app.status] || app.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(app.created_at).toLocaleDateString("fa-IR")}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedApplication(app);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>جزئیات درخواست کارآموزی</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نام و نام خانوادگی</Label>
                  <p className="font-medium">{selectedApplication.full_name}</p>
                </div>
                <div>
                  <Label>شماره تماس</Label>
                  <p className="font-medium">{selectedApplication.phone}</p>
                </div>
                <div>
                  <Label>سن</Label>
                  <p className="font-medium">{selectedApplication.age}</p>
                </div>
                <div>
                  <Label>شهر</Label>
                  <p className="font-medium">{selectedApplication.city}</p>
                </div>
                <div>
                  <Label>دپارتمان مورد نظر</Label>
                  <p className="font-medium">
                    {departmentLabels[selectedApplication.desired_department] || selectedApplication.desired_department}
                  </p>
                </div>
                <div>
                  <Label>در دسترس بودن</Label>
                  <p className="font-medium">
                    {availabilityLabels[selectedApplication.availability] || selectedApplication.availability}
                  </p>
                </div>
              </div>

              {selectedApplication.specialization && (
                <div>
                  <Label>تخصص</Label>
                  <p className="font-medium">{selectedApplication.specialization}</p>
                </div>
              )}

              {selectedApplication.self_introduction && (
                <div>
                  <Label>معرفی خود</Label>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                    {selectedApplication.self_introduction}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">وضعیت</Label>
                <Select
                  value={selectedApplication.status}
                  onValueChange={(value) =>
                    setSelectedApplication({ ...selectedApplication, status: value })
                  }
                >
                  <SelectTrigger>
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
                  value={selectedApplication.admin_notes || ""}
                  onChange={(e) =>
                    setSelectedApplication({
                      ...selectedApplication,
                      admin_notes: e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="یادداشت‌های داخلی..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  انصراف
                </Button>
                <Button
                  onClick={() =>
                    updateMutation.mutate({
                      id: selectedApplication.id,
                      updates: {
                        status: selectedApplication.status,
                        admin_notes: selectedApplication.admin_notes,
                      },
                    })
                  }
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
