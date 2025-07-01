
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import AcademyEnrollmentButton from '@/components/Academy/AcademyEnrollmentButton';

const BoundlessLanding = () => {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        <section className="py-20">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6">
              دوره جامع بدون مرز
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              یادگیری مهارت‌های کلیدی برای موفقیت در دنیای امروز
            </p>
            <div className="inline-block">
              <AcademyEnrollmentButton
                courseSlug="boundless"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                مشاهده جزئیات دوره
              </AcademyEnrollmentButton>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-purple-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                آماده شروع هستید؟
              </h3>
              <p className="text-gray-600 mb-6">
                همین الان در دوره بدون مرز ثبت‌نام کنید و مسیر موفقیت خود را آغاز کنید
              </p>
              
              <AcademyEnrollmentButton
                courseSlug="boundless"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                ثبت‌نام در دوره بدون مرز
              </AcademyEnrollmentButton>
            </div>
          </div>
        </div>

        <footer className="bg-gray-100 py-8">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-gray-500">
              © {new Date().getFullYear()} آکادمی آنلاین. تمامی حقوق محفوظ است.
            </p>
          </div>
        </footer>
      </div>
    </MainLayout>
  );
};

export default BoundlessLanding;
