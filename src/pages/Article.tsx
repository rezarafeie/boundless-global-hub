
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Article: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <Card>
        <CardHeader>
          <CardTitle>Article</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Article page will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Article;
