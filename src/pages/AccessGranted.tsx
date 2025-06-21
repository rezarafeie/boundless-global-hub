
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AccessGranted = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">دسترسی تأیید شد</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              تبریک! دسترسی شما با موفقیت تأیید شد. اکنون می‌توانید از تمام امکانات استفاده کنید.
            </p>
            <Button 
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              ادامه
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccessGranted;
