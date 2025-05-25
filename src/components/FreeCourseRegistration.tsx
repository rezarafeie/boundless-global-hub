
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { submitToGravityForm, getFormIdForCourse, type GravityFormSubmission } from "@/utils/gravityForms";
import { useNavigate } from "react-router-dom";

interface FreeCourseRegistrationProps {
  courseSlug: string;
  courseTitle: string;
  includeEmail?: boolean;
}

const FreeCourseRegistration = ({ courseSlug, courseTitle, includeEmail = false }: FreeCourseRegistrationProps) => {
  const [formData, setFormData] = useState<GravityFormSubmission>({
    first_name: "",
    last_name: "",
    phone: "",
    email: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formId = getFormIdForCourse(courseSlug);
      const submissionData = {
        ...formData,
        ...(includeEmail ? {} : { email: undefined })
      };
      
      await submitToGravityForm(formId, submissionData);
      
      toast({
        title: "ثبت‌نام موفق!",
        description: `شما در دوره ${courseTitle} ثبت‌نام شدید.`,
      });
      
      // Redirect to free course start page
      navigate("/start/free-course");
    } catch (error) {
      toast({
        title: "خطا در ثبت‌نام",
        description: "لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">ثبت‌نام در دوره رایگان</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="first_name"
              placeholder="نام"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
            <Input
              name="last_name"
              placeholder="نام خانوادگی"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>
          
          <Input
            name="phone"
            placeholder="شماره تلفن"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          
          {includeEmail && (
            <Input
              name="email"
              type="email"
              placeholder="ایمیل"
              value={formData.email}
              onChange={handleChange}
              required
            />
          )}
          
          <Button 
            type="submit" 
            className="w-full bg-black hover:bg-black/90" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "در حال ثبت‌نام..." : "شروع دوره رایگان"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FreeCourseRegistration;
