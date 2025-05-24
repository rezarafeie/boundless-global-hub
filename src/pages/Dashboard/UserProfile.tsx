
import React, { useEffect, useState } from "react";
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { User, Phone, Mail, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const UserProfile = () => {
  const { translations } = useLanguage();
  const { user, getUserProfile, updateUserProfile } = useAuth();
  const { toast } = useToast();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        const profile = await getUserProfile();
        if (profile) {
          setFirstName(profile.first_name || "");
          setLastName(profile.last_name || "");
          setEmail(profile.email || "");
          setPhone(profile.phone || "");
        }
      }
    };
    
    loadUserProfile();
  }, [user, getUserProfile]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await updateUserProfile({
        first_name: firstName,
        last_name: lastName,
        email,
        phone
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: translations.error,
        description: translations.updateProfileError || "Error updating profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="py-10">
        <div className="container max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">{translations.myProfile || "My Profile"}</h1>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User size={18} />
                {translations.personalInformation || "Personal Information"}
              </CardTitle>
              <CardDescription>
                {translations.updateProfileInfo || "Update your personal information"}
              </CardDescription>
            </CardHeader>
            
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{translations.firstName}</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{translations.lastName}</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail size={16} />
                    {translations.email}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone size={16} />
                    {translations.phone}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full md:w-auto"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    translations.saving || "Saving..."
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save size={16} />
                      {translations.saveChanges || "Save Changes"}
                    </span>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default UserProfile;
