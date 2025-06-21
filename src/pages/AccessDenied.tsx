
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">دسترسی مجاز نیست</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              متأسفانه شما به این بخش دسترسی ندارید. لطفاً با پشتیبانی تماس بگیرید یا به صفحه اصلی بازگردید.
            </p>
            <Button 
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              بازگشت به صفحه اصلی
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccessDenied;
