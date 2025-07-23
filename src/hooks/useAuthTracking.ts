import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { activityService } from '@/lib/activityService';

export const useAuthTracking = () => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Log user login
      const logLogin = async () => {
        try {
          await activityService.logActivity(
            Number(user.id),
            'user_logged_in',
            null,
            {
              user_name: user.name,
              login_time: new Date().toISOString()
            }
          );
        } catch (error) {
          console.error('Error logging user login:', error);
        }
      };

      logLogin();
    }
  }, [isAuthenticated, user?.id]);

  const logRegistration = async (userId: number, userData: any) => {
    try {
      await activityService.logActivity(
        userId,
        'user_registered',
        null,
        {
          user_name: userData.name,
          phone: userData.phone,
          email: userData.email,
          registration_time: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Error logging user registration:', error);
    }
  };

  const logSupportActivation = async (userId: number, courseId?: string) => {
    try {
      await activityService.logActivity(
        userId,
        'support_activated',
        courseId,
        {
          activation_time: new Date().toISOString()
        }
      );

      // Update course progress if courseId provided
      if (courseId) {
        await activityService.updateCourseProgress(
          userId,
          courseId,
          { support_activated: true }
        );
      }
    } catch (error) {
      console.error('Error logging support activation:', error);
    }
  };

  const logTelegramJoin = async (userId: number, courseId: string, channelName?: string) => {
    try {
      await activityService.logActivity(
        userId,
        'telegram_joined',
        courseId,
        {
          channel_name: channelName,
          join_time: new Date().toISOString()
        }
      );

      // Update course progress
      await activityService.updateCourseProgress(
        userId,
        courseId,
        { telegram_joined: true }
      );
    } catch (error) {
      console.error('Error logging telegram join:', error);
    }
  };

  const logCoursePageVisit = async (userId: number, courseId: string, courseTitle: string) => {
    try {
      await activityService.logActivity(
        userId,
        'course_page_visited',
        courseId,
        {
          course_title: courseTitle,
          visit_time: new Date().toISOString()
        }
      );

      // Update course progress
      await activityService.updateCourseProgress(
        userId,
        courseId,
        { course_page_visited: true }
      );
    } catch (error) {
      console.error('Error logging course page visit:', error);
    }
  };

  const logMaterialDownload = async (userId: number, courseId: string, fileName: string, fileUrl: string) => {
    try {
      await activityService.logActivity(
        userId,
        'material_downloaded',
        courseId,
        {
          file_name: fileName,
          file_url: fileUrl,
          download_time: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Error logging material download:', error);
    }
  };

  return {
    logRegistration,
    logSupportActivation,
    logTelegramJoin,
    logCoursePageVisit,
    logMaterialDownload
  };
};