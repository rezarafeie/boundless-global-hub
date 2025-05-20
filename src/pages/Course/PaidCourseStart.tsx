
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "@/components/Auth/AuthModal";
import { MessageCircle, FileText, CheckCircle, MessageSquare, Download, Video } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const PaidCourseStart = () => {
  const { translations } = useLanguage();
  const [searchParams] = useSearchParams();
  const courseTitle = searchParams.get('title') || "";
  const { user, activateAssistant } = useAuth();
  const navigate = useNavigate();
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [channelJoined, setChannelJoined] = useState(false);
  const [supportActivated, setSupportActivated] = useState(false);
  const [assistantActivated, setAssistantActivated] = useState(false);
  
  // Mock activation code
  const activationCode = "RAFIEI-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  useEffect(() => {
    // Redirect if not logged in and no course title
    if (!user && !courseTitle) {
      navigate('/courses');
    }
  }, [user, courseTitle, navigate]);

  const handleJoinChannel = () => {
    // Simulate joining Telegram channel
    window.open('https://t.me/rafieiAcademy', '_blank');
    setChannelJoined(true);
  };

  const handleActivateSupport = () => {
    // Simulate activating support
    setSupportActivated(true);
  };

  const handleActivateAssistant = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    
    await activateAssistant();
    setAssistantActivated(true);
  };

  const ActionBlock = ({ 
    icon, 
    title, 
    description, 
    buttonText, 
    onClick, 
    isCompleted 
  }: { 
    icon: React.ReactNode, 
    title: string, 
    description: string, 
    buttonText: string, 
    onClick: () => void, 
    isCompleted: boolean 
  }) => (
    <div className={`border rounded-lg p-6 transition-all ${isCompleted ? 'bg-gray-50 opacity-80' : 'bg-white'}`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-black/5 flex-shrink-0">
          {icon}
        </div>
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">{title}</h3>
            {isCompleted && (
              <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle size={12} className="mr-1" />
                {translations.completed || "Completed"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 mb-4">{description}</p>
          <Button 
            variant={isCompleted ? "outline" : "default"}
            onClick={onClick}
            className={isCompleted ? "opacity-50" : ""}
          >
            {isCompleted ? (
              <span className="flex items-center gap-2">
                <CheckCircle size={16} />
                {translations.done || "Done"}
              </span>
            ) : buttonText}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="container py-10">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-4">{courseTitle}</h1>
            <Badge variant="default" className="bg-black text-white hover:bg-black/90">{translations.paidCoursesTitle}</Badge>
            <p className="mt-4 text-muted-foreground">{translations.paidCourseWelcome}</p>
          </div>
          
          <div className="space-y-8">
            {/* Course files section */}
            <div className="border rounded-lg p-6 bg-gray-50">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText size={20} />
                {translations.courseFiles || "Course Files"}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {translations.courseFilesDescription || "Access all course materials and resources here."}
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <span className="font-medium">{translations.courseSlides || "Course Slides"}</span>
                  <Button size="sm" variant="outline" className="h-8">
                    {translations.download || "Download"}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <span className="font-medium">{translations.worksheets || "Worksheets"}</span>
                  <Button size="sm" variant="outline" className="h-8">
                    {translations.download || "Download"}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Player Activation */}
            <div className="border rounded-lg p-6 bg-gray-50">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Video size={20} />
                {translations.rafeiPlayer || "Rafiei Player"}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {translations.playerActivationDescription || "Access your course videos through the Rafiei Player."}
              </p>
              
              <Card className="mb-4">
                <CardContent className="pt-4">
                  <h3 className="font-medium mb-2">{translations.activationCode || "Activation Code"}</h3>
                  <div className="flex gap-2">
                    <Input value={activationCode} readOnly className="font-mono text-center" />
                    <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(activationCode)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c0-1.1.9-2 2-2h2"/><path d="M4 12c0-1.1.9-2 2-2h2"/><path d="M4 8c0-1.1.9-2 2-2h2"/></svg>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="gap-2" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <Download size={16} />
                    {translations.downloadDesktopPlayer || "Download for Desktop"}
                  </a>
                </Button>
                <Button variant="outline" className="gap-2" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    <Download size={16} />
                    {translations.downloadMobilePlayer || "Download for Mobile"}
                  </a>
                </Button>
              </div>
              
              <div className="mt-4">
                <Button className="w-full" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    {translations.openWebPlayer || "Open Web Player"}
                  </a>
                </Button>
              </div>
            </div>
            
            <h2 className="text-xl font-bold">{translations.activateAccess || "Activate Your Access"}</h2>
            <p className="text-muted-foreground -mt-4 mb-6">{translations.activateAccessDescription || "Complete these steps to get full access to your course"}</p>
            
            {/* Action blocks */}
            <div className="space-y-4">
              <ActionBlock 
                icon={<MessageCircle size={24} />}
                title={translations.joinChannel || "Join Private Telegram Channel"}
                description={translations.joinChannelDescription || "Get updates and connect with other students"}
                buttonText={translations.joinNow || "Join Now"}
                onClick={handleJoinChannel}
                isCompleted={channelJoined}
              />
              
              <ActionBlock 
                icon={<MessageSquare size={24} />}
                title={translations.activateSupport || "Activate Course Support"}
                description={translations.activateSupportDescription || "Get access to instructor support and Q&A"}
                buttonText={translations.activate || "Activate"}
                onClick={handleActivateSupport}
                isCompleted={supportActivated}
              />
              
              <ActionBlock 
                icon={<MessageCircle size={24} />}
                title={translations.smartAssistant || "Launch Smart Assistant"}
                description={translations.smartAssistantDescription || "Get AI-powered help with your course questions"}
                buttonText={translations.launch || "Launch"}
                onClick={handleActivateAssistant}
                isCompleted={assistantActivated}
              />
            </div>
            
            <div className="border-t pt-6 mt-8">
              <Button asChild className="w-full md:w-auto">
                <a 
                  href={`/course/paid/${encodeURIComponent(courseTitle)}`}
                  className="flex items-center gap-2"
                >
                  {translations.startLearning || "Start Learning"}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </MainLayout>
  );
};

export default PaidCourseStart;
