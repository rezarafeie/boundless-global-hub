import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { supabase } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GMAIL_CLIENT_ID = "242349790411-gkb8upvjoo1rcmtiru50mb9tu32eqt4g.apps.googleusercontent.com";
const GMAIL_CLIENT_SECRET = "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";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 Send enrollment email function called');
    const { enrollmentId } = await req.json();
    console.log('📝 Processing enrollment:', enrollmentId);

    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (title, description, redirect_url)
      `)
      .eq('id', enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      console.error('❌ Enrollment not found:', enrollmentError);
      throw new Error('Enrollment not found');
    }
    
    console.log('✅ Enrollment found:', enrollment.email, enrollment.courses?.title);

    // Get Gmail credentials
    const { data: credentials, error: credError } = await supabase
      .from('gmail_credentials')
      .select('*')
      .limit(1)
      .single();

    if (credError || !credentials) {
      console.log('No Gmail credentials configured, skipping email');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Gmail not configured' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if token needs refresh
    let accessToken = credentials.access_token;
    const now = new Date();
    const expiresAt = new Date(credentials.token_expires_at);

    if (now >= expiresAt) {
      // Refresh token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GMAIL_CLIENT_ID,
          client_secret: GMAIL_CLIENT_SECRET,
          refresh_token: credentials.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const refreshData = await refreshResponse.json();
      
      if (!refreshResponse.ok) {
        throw new Error(`Token refresh failed: ${refreshData.error_description || refreshData.error}`);
      }

      accessToken = refreshData.access_token;
      const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000));

      // Update credentials
      await supabase
        .from('gmail_credentials')
        .update({
          access_token: accessToken,
          token_expires_at: newExpiresAt.toISOString(),
        })
        .eq('id', credentials.id);
    }

    // Send emails
    const results = await Promise.allSettled([
      sendUserEmail(enrollment, accessToken),
      sendAdminEmail(enrollment, credentials.email_address, accessToken)
    ]);

    const userEmailResult = results[0];
    const adminEmailResult = results[1];

    return new Response(JSON.stringify({ 
      success: true,
      user_email: userEmailResult.status === 'fulfilled' ? 'sent' : 'failed',
      admin_email: adminEmailResult.status === 'fulfilled' ? 'sent' : 'failed',
      errors: [
        userEmailResult.status === 'rejected' ? userEmailResult.reason : null,
        adminEmailResult.status === 'rejected' ? adminEmailResult.reason : null,
      ].filter(Boolean)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Send enrollment email error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to send enrollment emails' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendUserEmail(enrollment: any, accessToken: string) {
  const course = enrollment.courses;
  
  // Get email template for this course or default
  let template = null;
  let templateError = null;
  
  // First try to get course-specific template
  const { data: courseTemplate, error: courseError } = await supabase
    .from('email_templates')
    .select('*')
    .eq('is_active', true)
    .eq('course_id', enrollment.course_id)
    .limit(1)
    .maybeSingle();
  
  if (courseTemplate) {
    template = courseTemplate;
  } else {
    // If no course-specific template, get default template
    const { data: defaultTemplate, error: defaultError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .is('course_id', null)
      .eq('is_default', true)
      .limit(1)
      .maybeSingle();
    
    template = defaultTemplate;
    templateError = defaultError;
  }

  console.log('Template query result:', { template, templateError });

  if (templateError || !template) {
    console.log('No email template found, using default');
    return sendDefaultUserEmail(enrollment, accessToken);
  }

  // Replace template variables
  const templateData = {
    user_name: enrollment.full_name,
    user_email: enrollment.email,
    user_phone: enrollment.phone,
    course_title: course?.title || 'نامشخص',
    course_description: course?.description || '',
    course_redirect_url: course?.redirect_url || '',
    enrollment_date: new Date(enrollment.created_at).toLocaleDateString('fa-IR'),
    payment_amount: enrollment.payment_amount.toLocaleString(),
    payment_status: getPaymentStatusText(enrollment.payment_status),
    spotplayer_license_key: enrollment.spotplayer_license_key || '',
    spotplayer_license_url: enrollment.spotplayer_license_url || '',
    spotplayer_license_id: enrollment.spotplayer_license_id || ''
  };

  let htmlContent = template.html_content;
  let textContent = template.text_content || '';
  let subject = template.subject;

  // Replace variables in content
  Object.entries(templateData).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    htmlContent = htmlContent.replace(regex, value || '');
    textContent = textContent.replace(regex, value || '');
    subject = subject.replace(regex, value || '');
  });

  // Handle conditional blocks like {{#if variable}}...{{/if}}
  htmlContent = processConditionalBlocks(htmlContent, templateData);
  textContent = processConditionalBlocks(textContent, templateData);

  const emailContent = `Subject: =?UTF-8?B?${btoa(subject)}?=
To: ${enrollment.email}
From: ${template.sender_name} <${template.sender_email}>
Content-Type: text/html; charset=UTF-8

${htmlContent}`;

  const base64Email = btoa(unescape(encodeURIComponent(emailContent)));
  
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64Email
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to send user email: ${error.error?.message || 'Unknown error'}`);
  }

  // Log email
  await supabase.from('email_logs').insert({
    user_id: enrollment.chat_user_id,
    course_id: enrollment.course_id,
    recipient: enrollment.email,
    subject: subject,
    status: 'success'
  });

  return await response.json();
}

async function sendDefaultUserEmail(enrollment: any, accessToken: string) {
  const course = enrollment.courses;
  
  const emailContent = `Subject: =?UTF-8?B?${btoa('تایید ثبت نام در دوره')}?=
To: ${enrollment.email}
Content-Type: text/html; charset=UTF-8

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
    <h2>سلام ${enrollment.full_name} عزیز!</h2>
    
    <p>ثبت نام شما در دوره <strong>${course?.title || 'نامشخص'}</strong> با موفقیت انجام شد.</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>جزئیات ثبت نام:</h3>
        <p><strong>نام:</strong> ${enrollment.full_name}</p>
        <p><strong>ایمیل:</strong> ${enrollment.email}</p>
        <p><strong>تلفن:</strong> ${enrollment.phone}</p>
        <p><strong>دوره:</strong> ${course?.title || 'نامشخص'}</p>
        <p><strong>مبلغ پرداختی:</strong> ${enrollment.payment_amount.toLocaleString()} تومان</p>
        <p><strong>وضعیت پرداخت:</strong> ${getPaymentStatusText(enrollment.payment_status)}</p>
    </div>
    
    <p>به زودی برای دسترسی به دوره با شما تماس خواهیم گرفت.</p>
    
    <p>با تشکر،<br>تیم آکادمی</p>
</body>
</html>`;

  const base64Email = btoa(unescape(encodeURIComponent(emailContent)));
  
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64Email
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to send user email: ${error.error?.message || 'Unknown error'}`);
  }

  // Log email
  await supabase.from('email_logs').insert({
    user_id: enrollment.chat_user_id,
    course_id: enrollment.course_id,
    recipient: enrollment.email,
    subject: 'تایید ثبت نام در دوره',
    status: 'success'
  });

  return await response.json();
}

async function sendAdminEmail(enrollment: any, adminEmail: string, accessToken: string) {
  const course = enrollment.courses;
  
  const emailContent = `Subject: =?UTF-8?B?${btoa('ثبت نام جدید در دوره')}?=
To: ${adminEmail}
Content-Type: text/html; charset=UTF-8

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
    <h2>ثبت نام جدید در دوره</h2>
    
    <p>کاربر جدیدی در دوره <strong>${course?.title || 'نامشخص'}</strong> ثبت نام کرده است.</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>جزئیات ثبت نام:</h3>
        <p><strong>نام:</strong> ${enrollment.full_name}</p>
        <p><strong>ایمیل:</strong> ${enrollment.email}</p>
        <p><strong>تلفن:</strong> ${enrollment.phone}</p>
        <p><strong>دوره:</strong> ${course?.title || 'نامشخص'}</p>
        <p><strong>مبلغ پرداختی:</strong> ${enrollment.payment_amount.toLocaleString()} تومان</p>
        <p><strong>وضعیت پرداخت:</strong> ${getPaymentStatusText(enrollment.payment_status)}</p>
        <p><strong>تاریخ ثبت نام:</strong> ${new Date(enrollment.created_at).toLocaleDateString('fa-IR')}</p>
    </div>
    
    <p>لطفاً در پنل مدیریت اقدامات لازم را انجام دهید.</p>
</body>
</html>`;

  const base64Email = btoa(unescape(encodeURIComponent(emailContent)));
  
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64Email
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to send admin email: ${error.error?.message || 'Unknown error'}`);
  }

  // Log email
  await supabase.from('email_logs').insert({
    user_id: enrollment.chat_user_id,
    course_id: enrollment.course_id,
    recipient: adminEmail,
    subject: 'ثبت نام جدید در دوره',
    status: 'success'
  });

  return await response.json();
}

function getPaymentStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'در انتظار پرداخت',
    'completed': 'پرداخت شده',
    'success': 'موفق',
    'failed': 'ناموفق',
    'cancelled': 'لغو شده'
  };
  return statusMap[status] || status;
}

function processConditionalBlocks(content: string, templateData: Record<string, any>): string {
  // Handle {{#if variable}}...{{/if}} blocks
  const ifBlockRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
  
  return content.replace(ifBlockRegex, (match, variable, blockContent) => {
    const value = templateData[variable];
    // Show block if value exists and is not empty
    if (value && value !== '' && value !== '0') {
      return blockContent;
    }
    return '';
  });
}