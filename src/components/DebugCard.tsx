
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bug, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Database, 
  CreditCard, 
  MessageSquare,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface APIResponse {
  service: string;
  status: 'success' | 'error' | 'pending';
  code?: number;
  payload?: any;
  timestamp: Date;
  responseTime?: number;
}

const DebugCard = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [apiResponses, setApiResponses] = useState<APIResponse[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Check if debug mode is enabled via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === 'true';
    setIsVisible(debugMode);

    // Initialize with some mock data for demonstration
    if (debugMode) {
      setApiResponses([
        {
          service: 'Supabase Auth',
          status: 'success',
          code: 200,
          payload: { user_id: 'xxx-xxx-xxx', email: 'user@example.com' },
          timestamp: new Date(),
          responseTime: 245
        },
        {
          service: 'Zarinpal Payment',
          status: 'pending',
          payload: { amount: 2500000, description: 'Course Payment' },
          timestamp: new Date(Date.now() - 30000),
        },
        {
          service: 'Faraaz SMS',
          status: 'error',
          code: 400,
          payload: { error: 'Invalid phone number format' },
          timestamp: new Date(Date.now() - 60000),
          responseTime: 1200
        }
      ]);
    }
  }, []);

  const addApiResponse = (response: APIResponse) => {
    setApiResponses(prev => [response, ...prev.slice(0, 9)]); // Keep last 10 responses
  };

  const clearLogs = () => {
    setApiResponses([]);
  };

  const testAPI = async (service: string) => {
    const response: APIResponse = {
      service,
      status: 'pending',
      timestamp: new Date()
    };
    
    addApiResponse(response);

    // Simulate API call
    setTimeout(() => {
      const updatedResponse: APIResponse = {
        ...response,
        status: Math.random() > 0.3 ? 'success' : 'error',
        code: Math.random() > 0.3 ? 200 : 400,
        payload: { test: true, timestamp: new Date().toISOString() },
        responseTime: Math.floor(Math.random() * 1000) + 100
      };
      
      setApiResponses(prev => 
        prev.map(r => 
          r.timestamp === response.timestamp ? updatedResponse : r
        )
      );
    }, Math.random() * 2000 + 500);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed ${isMinimized ? 'bottom-4 right-4' : 'top-4 right-4'} z-50 transition-all duration-300`}>
      <Card className={`bg-black/90 text-white border-gray-700 backdrop-blur-sm ${isMinimized ? 'w-auto' : 'w-96 max-h-[80vh]'} shadow-2xl`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-green-400" />
              <CardTitle className="text-lg">Debug Console</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:text-gray-300 h-8 w-8 p-0"
              >
                {isMinimized ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="pt-0 max-h-[60vh] overflow-y-auto">
            <Tabs defaultValue="logs" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="logs" className="text-white data-[state=active]:bg-gray-700">
                  API Logs
                </TabsTrigger>
                <TabsTrigger value="test" className="text-white data-[state=active]:bg-gray-700">
                  Test APIs
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="logs" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    {apiResponses.length} responses logged
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearLogs}
                    className="text-gray-400 hover:text-white h-8"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {apiResponses.map((response, index) => (
                    <div key={index} className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{response.service}</span>
                          <Badge 
                            variant={response.status === 'success' ? 'default' : response.status === 'error' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {response.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {response.status === 'error' && <XCircle className="w-3 h-3 mr-1" />}
                            {response.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {response.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-400">
                          {response.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {response.code && (
                        <div className="text-xs text-gray-400 mb-1">
                          Code: {response.code}
                          {response.responseTime && ` | ${response.responseTime}ms`}
                        </div>
                      )}
                      
                      {response.payload && (
                        <pre className="text-xs bg-gray-900 p-2 rounded text-green-400 overflow-x-auto">
                          {JSON.stringify(response.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                  
                  {apiResponses.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No API responses logged yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="test" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <Button
                    onClick={() => testAPI('Supabase Auth')}
                    className="w-full justify-start bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30"
                  >
                    <Database className="w-4 h-4 mr-2" />
                    Test Supabase Connection
                  </Button>
                  
                  <Button
                    onClick={() => testAPI('Zarinpal Payment')}
                    className="w-full justify-start bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Test Zarinpal API
                  </Button>
                  
                  <Button
                    onClick={() => testAPI('Faraaz SMS')}
                    className="w-full justify-start bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-600/30"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Test SMS API
                  </Button>
                </div>
                
                <div className="text-xs text-gray-400 mt-4 p-2 bg-gray-800/50 rounded">
                  <strong>Debug Mode:</strong> Add ?debug=true to URL to show this panel
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default DebugCard;
