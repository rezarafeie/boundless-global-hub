
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

const RedirectTo = () => {
  const { url } = useParams();

  useEffect(() => {
    if (url) {
      // Decode the URL parameter and redirect
      const decodedUrl = decodeURIComponent(url);
      
      // Add protocol if missing
      const redirectUrl = decodedUrl.startsWith('http') 
        ? decodedUrl 
        : `https://${decodedUrl}`;
      
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
    }
  }, [url]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <ExternalLink className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle>در حال انتقال...</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              لطفاً صبر کنید، در حال انتقال به مقصد مورد نظر هستیم.
            </p>
            {url && (
              <p className="text-sm text-gray-500 break-all">
                مقصد: {decodeURIComponent(url)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RedirectTo;
