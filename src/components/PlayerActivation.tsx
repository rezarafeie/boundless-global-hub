
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Download, Globe, Smartphone, Monitor, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const PlayerActivation = () => {
  const [activationCode] = useState("RAFIEI-2024-" + Math.random().toString(36).substr(2, 6).toUpperCase());
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyActivationCode = () => {
    navigator.clipboard.writeText(activationCode);
    setCopied(true);
    toast({
      title: "کد کپی شد",
      description: "کد فعال‌سازی در کلیپ‌بورد کپی شد",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-black/5 shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Play className="w-5 h-5" />
          فعال‌سازی پلیر اختصاصی رفیعی
        </h2>
        
        <div className="space-y-6">
          {/* Activation Code */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              کد فعال‌سازی شما
            </h3>
            <div className="flex items-center gap-3 bg-white p-3 rounded border">
              <code className="flex-1 text-lg font-mono text-blue-600">{activationCode}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyActivationCode}
                className="flex items-center gap-2"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "کپی شد" : "کپی"}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">مراحل فعال‌سازی:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                <p>پلیر رفیعی را دانلود و نصب کنید</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                <p>کد فعال‌سازی را در بخش تنظیمات وارد کنید</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                <p>از تمام ویدیوهای دوره با کیفیت بالا لذت ببرید</p>
              </div>
            </div>
          </div>

          {/* Download Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50"
              onClick={() => window.open('https://player.rafiei.co/download/windows', '_blank')}
            >
              <Monitor size={24} className="text-blue-500" />
              <div className="text-center">
                <div className="font-medium">ویندوز</div>
                <div className="text-xs text-gray-500">Windows 10+</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-green-50"
              onClick={() => window.open('https://player.rafiei.co/download/mobile', '_blank')}
            >
              <Smartphone size={24} className="text-green-500" />
              <div className="text-center">
                <div className="font-medium">موبایل</div>
                <div className="text-xs text-gray-500">iOS & Android</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-purple-50"
              onClick={() => window.open('https://web.rafiei.co/player', '_blank')}
            >
              <Globe size={24} className="text-purple-500" />
              <div className="text-center">
                <div className="font-medium">وب پلیر</div>
                <div className="text-xs text-gray-500">مرورگر</div>
              </div>
            </Button>
          </div>

          {/* Features */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 text-green-800">ویژگی‌های پلیر اختصاصی:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-green-600" />
                <span>پخش با کیفیت 4K</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-green-600" />
                <span>دانلود برای مشاهده آفلاین</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-green-600" />
                <span>سرعت پخش قابل تنظیم</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-green-600" />
                <span>زیرنویس فارسی و انگلیسی</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerActivation;
