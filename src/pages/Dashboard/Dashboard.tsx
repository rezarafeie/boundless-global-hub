
import React, { useEffect, useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  BookOpen, 
  Award, 
  MessageCircle, 
  Settings, 
  ExternalLink, 
  Clock, 
  CheckCircle,
  LogOut
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

interface UserCourse {
  id: string;
  course_id: string;
  course_title: string;
  progress: number;
  status: "ongoing" | "completed";
  created_at: string;
  is_paid: boolean;
}

interface UserTest {
  id: string;
  test_id: string;
  test_title: string;
  status: "ongoing" | "completed";
  created_at: string;
}

const Dashboard = () => {
  const { translations, language } = useLanguage();
  const { user, signOut, getUserProfile } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [courses, setCourses] = useState<UserCourse[]>([]);
  const [tests, setTests] = useState<UserTest[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        // Get user profile
        const profileData = await getUserProfile();
        setProfile(profileData);
        
        // Get user courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('user_courses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (coursesError) throw coursesError;
        setCourses(coursesData || []);
        
        // Get user tests
        const { data: testsData, error: testsError } = await supabase
          .from('user_tests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (testsError) throw testsError;
        setTests(testsData || []);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, getUserProfile]);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  const getLastAccessedText = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return translations.today || "Today";
    } else if (diffDays === 1) {
      return translations.yesterday || "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} ${translations.daysAgo || "days ago"}`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? (translations.weekAgo || "week ago") : (translations.weeksAgo || "weeks ago")}`;
    } else {
      return formatDate(dateString);
    }
  };

  return (
    <MainLayout>
      <div className="py-10">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">{translations.dashboard || "Dashboard"}</h1>
              <p className="text-muted-foreground mt-1">{translations.manageCourses || "Manage your courses, tests and account information"}</p>
            </div>
            <img 
              src="/lovable-uploads/a77fd37e-3b28-461c-a4de-b1b0b2f771b7.png" 
              alt="Rafiei Academy"
              className="h-12 w-auto opacity-20"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={18} />
                  {translations.profile || "Profile"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3 animate-pulse">
                      <User size={36} className="text-gray-400" />
                    </div>
                    <div className="h-5 w-32 bg-gray-100 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-40 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center mb-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <User size={36} className="text-gray-400" />
                    </div>
                    <h3 className="font-bold text-lg">
                      {profile?.first_name} {profile?.last_name}
                    </h3>
                    <p className="text-muted-foreground text-sm">{profile?.email}</p>
                    {profile?.phone && (
                      <p className="text-muted-foreground text-sm">{profile?.phone}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {translations.joinDate || "Join date"}: {profile?.created_at ? formatDate(profile.created_at) : ''}
                    </p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/profile">
                      <User size={16} className="mr-2" />
                      {translations.editProfile || "Edit Profile"}
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/settings">
                      <Settings size={16} className="mr-2" />
                      {translations.accountSettings || "Account Settings"}
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-500 hover:text-red-600" onClick={signOut}>
                    <LogOut size={16} className="mr-2" />
                    {translations.signOut || "Sign Out"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Access Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink size={18} />
                  {translations.quickAccess || "Quick Access"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto py-6 flex flex-col items-center gap-2" onClick={() => window.open("https://ai.rafiei.co/", "_blank")}>
                  <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center">
                    <MessageCircle size={24} />
                  </div>
                  <span>{translations.smartAssistant || "Smart Assistant"}</span>
                </Button>
                
                <Button variant="outline" className="h-auto py-6 flex flex-col items-center gap-2" asChild>
                  <Link to="/support">
                    <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center">
                      <MessageCircle size={24} />
                    </div>
                    <span>{translations.support || "Support"}</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto py-6 flex flex-col items-center gap-2" asChild>
                  <Link to="/assessment-center">
                    <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center">
                      <Award size={24} />
                    </div>
                    <span>{translations.assessmentCenter || "Assessment Center"}</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Courses and Assessments Tabs */}
          <div className="mt-8">
            <Tabs defaultValue="courses">
              <TabsList className="mb-6">
                <TabsTrigger value="courses" className="flex items-center gap-1">
                  <BookOpen size={16} />
                  <span>{translations.myCourses || "My Courses"}</span>
                </TabsTrigger>
                <TabsTrigger value="assessments" className="flex items-center gap-1">
                  <Award size={16} />
                  <span>{translations.assessments || "Assessments"}</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="courses">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-2">
                          <div className="h-6 w-3/4 bg-gray-100 rounded mb-2"></div>
                          <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-2 bg-gray-100 rounded-full mb-4"></div>
                        </CardContent>
                        <CardFooter>
                          <div className="h-9 w-full bg-gray-100 rounded"></div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : courses.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">
                        {translations.noCourses || "You haven't enrolled in any courses yet."}
                      </p>
                      <Button className="mt-4" asChild>
                        <Link to="/courses">
                          {translations.browseCourses || "Browse Courses"}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map(course => (
                      <Card key={course.id}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{course.course_title}</CardTitle>
                            {course.status === 'ongoing' && (
                              <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-800 border-yellow-200">
                                <Clock size={12} />
                                {translations.ongoing || "In Progress"}
                              </Badge>
                            )}
                            {course.status === 'completed' && (
                              <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-800 border-green-200">
                                <CheckCircle size={12} />
                                {translations.completed || "Completed"}
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {translations.lastAccessed || "Last accessed"}: {getLastAccessedText(course.created_at)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-2 flex justify-between text-sm">
                            <span>{translations.progress || "Progress"}</span>
                            <span>{course.progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-black rounded-full transition-all duration-500"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button asChild className="w-full">
                            <Link to={`/start/${course.is_paid ? 'paid' : 'free'}-course?title=${encodeURIComponent(course.course_title)}`}>
                              {translations.continueCourse || "Continue Course"}
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="assessments">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader>
                          <div className="h-6 w-3/4 bg-gray-100 rounded mb-2"></div>
                          <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                        </CardHeader>
                        <CardFooter>
                          <div className="h-9 w-full bg-gray-100 rounded"></div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : tests.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">
                        {translations.noAssessments || "You haven't taken any assessments yet."}
                      </p>
                      <Button className="mt-4" asChild>
                        <Link to="/assessment-center">
                          {translations.browseAssessments || "Browse Assessments"}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tests.map(test => (
                      <Card key={test.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{test.test_title}</CardTitle>
                            {test.status === 'ongoing' ? (
                              <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-800 border-blue-200">
                                <Clock size={12} />
                                {translations.pendingCompletion || "Pending Completion"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-800 border-green-200">
                                <CheckCircle size={12} />
                                {translations.completed || "Completed"}
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            {translations.startedOn || "Started on"}: {formatDate(test.created_at)}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter>
                          <Button asChild className="w-full" variant={test.status === 'completed' ? "outline" : "default"}>
                            <Link to={`/assessment/${test.test_id}`}>
                              {test.status === 'completed' 
                                ? translations.viewResults || "View Results" 
                                : translations.continueAssessment || "Continue Assessment"}
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
