
// WordPress API integration for Gravity Forms and WooCommerce
const WORDPRESS_BASE_URL = 'https://academy.rafeie.com/wp-json';

// Gravity Forms credentials
const GF_CONSUMER_KEY = 'ck_93bea03c4a633784bb366824b135849a4634fc49';
const GF_CONSUMER_SECRET = 'cs_6f272c22224119a44b8acaa82b52bb5946becf86';

// WooCommerce credentials  
const WC_CONSUMER_KEY = 'ck_399e9f8bb4142006fa4c4308097990aef53cde8f';
const WC_CONSUMER_SECRET = 'cs_bee3e3f8827c00d0f46bc53898f4c91da0126f67';

// Course to Form ID mapping
const COURSE_FORM_MAPPING: Record<string, number> = {
  'boundless-taste': 1,
  'passive-income-ai': 35,
  'change-project': 27,
  'american-business': 33
};

// Course to Product ID mapping
const COURSE_PRODUCT_MAPPING: Record<string, number> = {
  'boundless': 5311,
  'instagram': 5089,
  'metaverse': 145
};

interface FormSubmissionData {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

interface OrderData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// Helper function to create Basic Auth header
const createAuthHeader = (key: string, secret: string): string => {
  const credentials = btoa(`${key}:${secret}`);
  return `Basic ${credentials}`;
};

// Submit to Gravity Forms
export const submitToGravityForm = async (courseSlug: string, data: FormSubmissionData) => {
  const formId = COURSE_FORM_MAPPING[courseSlug];
  
  if (!formId) {
    throw new Error(`No form mapping found for course: ${courseSlug}`);
  }

  const url = `${WORDPRESS_BASE_URL}/gf/v2/forms/${formId}/submissions`;
  
  // Build form data based on form requirements
  const formData: Record<string, string> = {
    '1': data.firstName,
    '2': data.lastName,
    '3': data.phone
  };

  // Add email only for Form ID 1 (مزه بدون مرز)
  if (formId === 1 && data.email) {
    formData['4'] = data.email;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': createAuthHeader(GF_CONSUMER_KEY, GF_CONSUMER_SECRET)
    },
    body: JSON.stringify(formData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gravity Forms submission error:', errorText);
    throw new Error(`Gravity Forms submission failed: ${response.status}`);
  }

  return await response.json();
};

// Create WooCommerce order
export const createWooCommerceOrder = async (courseSlug: string, data: OrderData) => {
  const productId = COURSE_PRODUCT_MAPPING[courseSlug];
  
  if (!productId) {
    throw new Error(`No product mapping found for course: ${courseSlug}`);
  }

  const url = `${WORDPRESS_BASE_URL}/wc/v3/orders`;
  
  const orderData = {
    payment_method: 'zarinpal',
    payment_method_title: 'Zarinpal',
    set_paid: false,
    billing: {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone
    },
    line_items: [
      {
        product_id: productId,
        quantity: 1
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': createAuthHeader(WC_CONSUMER_KEY, WC_CONSUMER_SECRET)
    },
    body: JSON.stringify(orderData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('WooCommerce order creation error:', errorText);
    throw new Error(`WooCommerce order creation failed: ${response.status}`);
  }

  const order = await response.json();
  return order;
};

// Get course type based on slug
export const getCourseType = (courseSlug: string): 'free' | 'paid' => {
  if (COURSE_FORM_MAPPING[courseSlug]) {
    return 'free';
  }
  if (COURSE_PRODUCT_MAPPING[courseSlug]) {
    return 'paid';
  }
  throw new Error(`Unknown course slug: ${courseSlug}`);
};
