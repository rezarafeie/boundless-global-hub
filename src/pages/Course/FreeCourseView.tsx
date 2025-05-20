
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";

interface FreeCourseViewProps {
  language?: "en" | "fa";
}

const FreeCourseView = ({ language: propLanguage }: FreeCourseViewProps) => {
  const { translations, setLanguage, language } = useLanguage();
  const { courseTitle } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (propLanguage) {
      setLanguage(propLanguage);
    }
  }, [propLanguage, setLanguage]);
  
  useEffect(() => {
    // Redirect to homepage if no course title is provided
    if (!courseTitle) {
      navigate(language === "en" ? "/en" : "/");
    }
  }, [courseTitle, navigate, language]);

  return (
    <MainLayout>
      <div className="container py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">{decodeURIComponent(courseTitle || "")}</h1>
          
          <div className="bg-gray-50 border border-black/10 p-8 rounded-lg shadow-md mb-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-semibold mb-4">{translations.freeCourseAccess}</h2>
              <p className="text-gray-600 mb-6">{translations.freeCourseAccessInstructions}</p>
              
              <div className="aspect-video bg-gray-200 max-w-2xl mx-auto rounded-lg flex items-center justify-center border border-black/10">
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">{translations.videoPlayerPlaceholder}</p>
                  <p className="text-sm text-gray-500">{translations.youtubeEmbed}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-md border border-black/10 mt-8">
              <h3 className="font-medium mb-4 text-lg">{translations.upgradeToPremium}</h3>
              <p className="text-sm text-gray-600 mb-4">{translations.upgradeToPremiumDescription}</p>
              <div className="flex justify-center">
                <button className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors">
                  {translations.viewPaidCourses}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FreeCourseView;
