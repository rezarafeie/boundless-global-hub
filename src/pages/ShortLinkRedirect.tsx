import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getShortLinkBySlug, incrementClickCount } from '@/lib/urlShortener';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, AlertCircle } from 'lucide-react';

const ShortLinkRedirect: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      if (!slug) {
        setError('کد کوتاه مشخص نشده است');
        setLoading(false);
        return;
      }

      try {
        const shortLink = await getShortLinkBySlug(slug);
        
        if (!shortLink) {
          setError('لینک کوتاه پیدا نشد');
          setLoading(false);
          return;
        }

        // Increment click count
        await incrementClickCount(slug);

        // Set the redirect URL for display
        setRedirectUrl(shortLink.original_url);

        // Perform the redirect after a short delay
        setTimeout(() => {
          window.location.href = shortLink.original_url;
        }, 1000);

      } catch (err) {
        console.error('Error in redirect:', err);
        setError('خطا در انتقال به لینک مورد نظر');
        setLoading(false);
      }
    };

    handleRedirect();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
              در حال انتقال...
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-center">
              لطفاً صبر کنید، در حال هدایت شما به مقصد مورد نظر هستیم.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 border-red-200 dark:border-red-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-xl font-semibold text-red-800 dark:text-red-300 mb-2">
              خطا در انتقال
            </h1>
            <p className="text-red-600 dark:text-red-400 text-center mb-4">
              {error}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              کد مورد نظر: <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{slug}</code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state - showing redirect URL before redirect
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 border-green-200 dark:border-green-800">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ExternalLink className="h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-2">
            در حال انتقال...
          </h1>
          <p className="text-green-600 dark:text-green-400 text-center mb-4">
            شما به زودی به آدرس زیر منتقل خواهید شد:
          </p>
          <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg w-full">
            <p className="text-sm text-slate-600 dark:text-slate-300 break-all text-center">
              {redirectUrl}
            </p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
            اگر انتقال خودکار انجام نشد، روی لینک بالا کلیک کنید.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShortLinkRedirect;