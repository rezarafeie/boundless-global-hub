
import React from "react";
import { useParams } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";

const ModulePage = () => {
  const { moduleId } = useParams();

  return (
    <MainLayout>
      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-6 h-6" />
                صفحه ماژول
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                نمایش ماژول با شناسه: {moduleId}
              </p>
              <p className="mt-4 text-sm text-gray-500">
                این صفحه در حال توسعه است و به زودی محتوای کامل ماژول در اینجا نمایش داده خواهد شد.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default ModulePage;
