
const GRAVITY_FORMS_API_URL = "https://rafeie.com/wp-json/gf/v2/forms";
const API_CREDENTIALS = btoa("ck_93bea03c4a633784bb366824b135849a4634fc49:cs_6f272c22224119a44b8acaa82b52bb5946becf86");

export interface GravityFormSubmission {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
}

export const submitToGravityForm = async (formId: number, data: GravityFormSubmission) => {
  try {
    const response = await fetch(`${GRAVITY_FORMS_API_URL}/${formId}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${API_CREDENTIALS}`,
      },
      body: JSON.stringify({
        "1": data.first_name,
        "2": data.last_name,
        "3": data.phone,
        ...(data.email && { "4": data.email })
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Gravity Forms submission error:", error);
    throw error;
  }
};

export const getFormIdForCourse = (courseSlug: string): number => {
  const formMapping: Record<string, number> = {
    "boundless-taste": 1,
    "passive-income": 35,
    "change-project": 27,
    "american-business": 33
  };
  
  return formMapping[courseSlug] || 1;
};
