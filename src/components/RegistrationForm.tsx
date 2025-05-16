
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface RegistrationFormProps {
  courseTitle?: string;
  isPaid?: boolean;
}

const RegistrationForm = ({ courseTitle, isPaid = false }: RegistrationFormProps) => {
  const { translations, direction, language } = useLanguage();
  
  const formSchema = z.object({
    firstName: z.string().min(2, {
      message: language === "en" ? "First name must be at least 2 characters." : "نام باید حداقل 2 کاراکتر باشد.",
    }),
    lastName: z.string().min(2, {
      message: language === "en" ? "Last name must be at least 2 characters." : "نام خانوادگی باید حداقل 2 کاراکتر باشد.",
    }),
    email: z.string().email({
      message: language === "en" ? "Please enter a valid email address." : "لطفاً یک آدرس ایمیل معتبر وارد کنید.",
    }),
    phone: z.string().min(10, {
      message: language === "en" ? "Phone number must be at least 10 digits." : "شماره تلفن باید حداقل 10 رقم باشد.",
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
    
    // Show success toast
    toast({
      title: isPaid 
        ? language === "en" ? "Registration Successful!" : "ثبت نام موفق!" 
        : language === "en" ? "Enrollment Successful!" : "ثبت نام موفق!",
      description: isPaid 
        ? language === "en" ? "Please proceed to payment." : "لطفاً برای پرداخت ادامه دهید." 
        : language === "en" ? `You are now enrolled in ${courseTitle}.` : `شما اکنون در دوره ${courseTitle} ثبت نام شده اید.`,
    });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-gradient-to-br from-background to-secondary/30 p-6 rounded-xl shadow-lg border border-primary/10">
      <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
        {isPaid 
          ? language === "en" ? "Register for this Course" : "ثبت نام برای این دوره" 
          : language === "en" ? "Enroll for Free" : "ثبت نام رایگان"}
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "en" ? "First Name" : "نام"}</FormLabel>
                  <FormControl>
                    <Input placeholder={language === "en" ? "Enter your first name" : "نام خود را وارد کنید"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "en" ? "Last Name" : "نام خانوادگی"}</FormLabel>
                  <FormControl>
                    <Input placeholder={language === "en" ? "Enter your last name" : "نام خانوادگی خود را وارد کنید"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{language === "en" ? "Email" : "ایمیل"}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder={language === "en" ? "Enter your email" : "ایمیل خود را وارد کنید"} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{language === "en" ? "Phone" : "شماره تلفن"}</FormLabel>
                <FormControl>
                  <Input placeholder={language === "en" ? "Enter your phone number" : "شماره تلفن خود را وارد کنید"} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 shadow-lg hover:shadow-primary/20"
            size="lg"
          >
            {isPaid 
              ? language === "en" ? "Register & Continue to Payment" : "ثبت نام و ادامه به پرداخت" 
              : language === "en" ? "Enroll Now" : "ثبت نام"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default RegistrationForm;
