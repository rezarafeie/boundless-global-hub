
import React, { useState } from 'react';
import HubManagementPanel from '@/components/Admin/HubManagementPanel';
import HubManagementQuickActions from '@/components/Admin/HubManagementQuickActions';
import AnnouncementManagementModal from '@/components/Admin/AnnouncementManagementModal';
import LiveStreamManagementModal from '@/components/Admin/LiveStreamManagementModal';
import RafieiMeetManagementModal from '@/components/Admin/RafieiMeetManagementModal';

const HubManagementSection = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const closeModal = () => setActiveModal(null);

  return (
    <div className="space-y-6">
      <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg p-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          مدیریت ماژول‌های Hub
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          کنترل کامل Rafiei Meet، پخش زنده، اعلانات و ترتیب نمایش
        </p>
      </div>

      {/* Quick Actions Grid */}
      <HubManagementQuickActions onOpenModal={setActiveModal} />

      {/* Hub Management Panel */}
      <HubManagementPanel />

      {/* Modals */}
      <AnnouncementManagementModal 
        isOpen={activeModal === 'announcements'} 
        onClose={closeModal}
      />
      
      <LiveStreamManagementModal 
        isOpen={activeModal === 'live'} 
        onClose={closeModal}
      />
      
      <RafieiMeetManagementModal 
        isOpen={activeModal === 'meet'} 
        onClose={closeModal}
      />
    </div>
  );
};

export default HubManagementSection;
