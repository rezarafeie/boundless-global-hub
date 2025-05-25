
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import BoundlessLanding from '@/pages/Courses/BoundlessLanding';
import InstagramLanding from '@/pages/Courses/InstagramLanding';
import MetaverseLanding from '@/pages/Courses/MetaverseLanding';
import WealthLanding from '@/pages/Courses/WealthLanding';

const CourseLanding = () => {
  const { slug } = useParams<{ slug: string }>();

  // Map course slugs to their specific landing pages
  switch (slug) {
    case 'boundless':
      return <BoundlessLanding />;
    case 'instagram':
      return <InstagramLanding />;
    case 'metaverse':
      return <MetaverseLanding />;
    case 'wealth':
      return <WealthLanding />;
    default:
      // Redirect unknown courses to main courses page
      return <Navigate to="/courses" replace />;
  }
};

export default CourseLanding;
