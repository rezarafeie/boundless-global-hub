
const WOOCOMMERCE_API_URL = "https://rafeie.com/wp-json/wc/v3";
const API_CREDENTIALS = btoa("ck_399e9f8bb4142006fa4c4308097990aef53cde8f:cs_bee3e3f8827c00d0f46bc53898f4c91da0126f67");

export interface CheckoutData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  product_id: number;
}

export interface WooCommerceOrder {
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  line_items: Array<{
    product_id: number;
    quantity: number;
  }>;
}

export const createWooCommerceOrder = async (data: CheckoutData) => {
  try {
    const orderData: WooCommerceOrder = {
      payment_method: "zarinpal",
      payment_method_title: "Zarinpal",
      set_paid: false,
      billing: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
      },
      line_items: [
        {
          product_id: data.product_id,
          quantity: 1,
        },
      ],
    };

    const response = await fetch(`${WOOCOMMERCE_API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${API_CREDENTIALS}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("WooCommerce order creation error:", error);
    throw error;
  }
};

export const getProductIdForCourse = (courseSlug: string): number => {
  const productMapping: Record<string, number> = {
    "boundless": 5311,
    "instagram": 5089,
    "metaverse": 145,
    "smart-pack": 5312 // Smart Pack course
  };
  
  return productMapping[courseSlug] || 5311;
};
