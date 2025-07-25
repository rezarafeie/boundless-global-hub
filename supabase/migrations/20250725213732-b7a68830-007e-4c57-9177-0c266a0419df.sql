-- Create email templates table
CREATE TABLE public.email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  sender_name text NOT NULL DEFAULT 'Academy Rafiei',
  sender_email text NOT NULL DEFAULT 'academyrafeie@gmail.com',
  subject text NOT NULL,
  html_content text NOT NULL,
  text_content text,
  is_active boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage email templates" 
  ON public.email_templates 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM chat_users 
    WHERE id = (auth.uid()::text)::integer 
    AND is_messenger_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM chat_users 
    WHERE id = (auth.uid()::text)::integer 
    AND is_messenger_admin = true
  ));

CREATE POLICY "Anyone can view active email templates" 
  ON public.email_templates 
  FOR SELECT 
  USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default template
INSERT INTO public.email_templates (
  name,
  course_id,
  sender_name,
  sender_email,
  subject,
  html_content,
  text_content,
  is_default
) VALUES (
  'Default Enrollment Confirmation',
  NULL,
  'Academy Rafiei',
  'academyrafeie@gmail.com',
  'تایید ثبت‌نام در دوره {{course_title}}',
  '<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تایید ثبت‌نام</title>
</head>
<body style="font-family: Tahoma, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0;">
    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🎉 تبریک!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">ثبت‌نام شما با موفقیت انجام شد</p>
        </div>
        
        <div style="padding: 30px;">
            <h2 style="color: #333; margin-bottom: 20px;">سلام {{user_name}} عزیز،</h2>
            
            <p style="margin-bottom: 20px; font-size: 16px;">
                با سپاس از اعتماد شما، ثبت‌نام شما در دوره <strong>{{course_title}}</strong> با موفقیت تایید شد.
            </p>
            
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #495057; margin-bottom: 15px;">📋 جزئیات ثبت‌نام:</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="margin-bottom: 10px;"><strong>نام دوره:</strong> {{course_title}}</li>
                    <li style="margin-bottom: 10px;"><strong>نام شما:</strong> {{user_name}}</li>
                    <li style="margin-bottom: 10px;"><strong>ایمیل:</strong> {{user_email}}</li>
                    <li style="margin-bottom: 10px;"><strong>شماره تماس:</strong> {{user_phone}}</li>
                    <li style="margin-bottom: 10px;"><strong>تاریخ ثبت‌نام:</strong> {{enrollment_date}}</li>
                    <li style="margin-bottom: 10px;"><strong>مبلغ پرداختی:</strong> {{payment_amount}} تومان</li>
                </ul>
            </div>
            
            {{#if spotplayer_license_key}}
            <div style="background-color: #e8f5e8; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #28a745;">
                <h3 style="color: #155724; margin-bottom: 15px;">🔑 اطلاعات دسترسی:</h3>
                <p style="margin-bottom: 10px;"><strong>کلید لایسنس:</strong> <code style="background-color: #f8f9fa; padding: 4px 8px; border-radius: 4px; font-family: monospace;">{{spotplayer_license_key}}</code></p>
                {{#if spotplayer_license_url}}
                <p style="margin-bottom: 10px;">
                    <strong>لینک دسترسی:</strong> 
                    <a href="{{spotplayer_license_url}}" style="color: #007bff; text-decoration: none;">کلیک کنید</a>
                </p>
                {{/if}}
            </div>
            {{/if}}
            
            {{#if course_redirect_url}}
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{course_redirect_url}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: bold; transition: all 0.3s ease;">
                    🚀 شروع دوره
                </a>
            </div>
            {{/if}}
            
            <div style="background-color: #fff3cd; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h3 style="color: #856404; margin-bottom: 15px;">📞 اطلاعات تماس:</h3>
                <p style="margin-bottom: 10px;">در صورت داشتن هرگونه سوال، با ما در تماس باشید:</p>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    <li style="margin-bottom: 8px;">📧 ایمیل: academyrafeie@gmail.com</li>
                    <li style="margin-bottom: 8px;">💬 تلگرام: @AcademyRafiei</li>
                    <li style="margin-bottom: 8px;">🌐 وبسایت: https://academy.rafiei.net</li>
                </ul>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
                با تشکر از همراهی شما<br>
                <strong>آکادمی رفیعی</strong>
            </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">این ایمیل به صورت خودکار ارسال شده است. لطفاً پاسخ ندهید.</p>
        </div>
    </div>
</body>
</html>',
  'سلام {{user_name}} عزیز،

با سپاس از اعتماد شما، ثبت‌نام شما در دوره {{course_title}} با موفقیت تایید شد.

جزئیات ثبت‌نام:
- نام دوره: {{course_title}}
- نام شما: {{user_name}}
- ایمیل: {{user_email}}
- شماره تماس: {{user_phone}}
- تاریخ ثبت‌نام: {{enrollment_date}}
- مبلغ پرداختی: {{payment_amount}} تومان

{{#if spotplayer_license_key}}
اطلاعات دسترسی:
کلید لایسنس: {{spotplayer_license_key}}
{{#if spotplayer_license_url}}
لینک دسترسی: {{spotplayer_license_url}}
{{/if}}
{{/if}}

{{#if course_redirect_url}}
لینک شروع دوره: {{course_redirect_url}}
{{/if}}

اطلاعات تماس:
ایمیل: academyrafeie@gmail.com
تلگرام: @AcademyRafiei
وبسایت: https://academy.rafiei.net

با تشکر از همراهی شما
آکادمی رفیعی',
  true
);