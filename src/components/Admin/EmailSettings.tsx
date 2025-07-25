import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle, XCircle, RefreshCw, Search, Calendar } from 'lucide-react';

interface GmailCredentials {
  id: string;
  email_address: string;
  token_expires_at: string;
  created_at: string;
}

interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  status: string;
  error_message?: string;
  created_at: string;
  courses?: { title: string };
  chat_users?: { name: string };
}

const EmailSettings: React.FC = () => {
  const [credentials, setCredentials] = useState<GmailCredentials | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCredentials();
    fetchEmailLogs();
  }, []);

  const fetchCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from('gmail_credentials')
        .select('*')
        .limit(1);

      if (error) {
        console.error('Error fetching credentials:', error);
        return;
      }

      // Handle case where no credentials exist
      if (data && data.length > 0) {
        setCredentials(data[0]);
      } else {
        setCredentials(null);
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
    }
  };

  const fetchEmailLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_logs')
        .select(`
          *,
          courses (title),
          chat_users (name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching email logs:', error);
        return;
      }

      setEmailLogs(data || []);
    } catch (error) {
      console.error('Error fetching email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectGmail = async () => {
    try {
      setOauthLoading(true);
      
      console.log('Starting Gmail OAuth process...');
      
      // Get OAuth URL
      const { data: urlData, error: urlError } = await supabase.functions.invoke('gmail-oauth', {
        body: { action: 'get_auth_url' }
      });

      console.log('OAuth URL response:', { urlData, urlError });

      if (urlError || !urlData?.auth_url) {
        throw new Error(`Failed to get OAuth URL: ${urlError?.message || 'No auth URL returned'}`);
      }

      // Open OAuth URL in new window
      const authWindow = window.open(
        urlData.auth_url, 
        'gmail-oauth', 
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );
      
      if (!authWindow) {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }

      // Listen for messages from the OAuth popup
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'gmail_oauth_success') {
          console.log('OAuth success received:', event.data);
          
          // Clean up
          window.removeEventListener('message', handleMessage);
          authWindow.close();
          
          toast({
            title: "موفق",
            description: `Gmail successfully connected: ${event.data.email}`,
          });

          // Refresh credentials
          fetchCredentials();
          setOauthLoading(false);
        }
      };

      // Add message listener
      window.addEventListener('message', handleMessage);

      // Check if window was closed manually
      const checkClosed = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setOauthLoading(false);
        }
      }, 1000);

    } catch (error: any) {
      console.error('Gmail OAuth error:', error);
      toast({
        title: "خطا",
        description: error.message || 'Failed to connect Gmail',
        variant: "destructive"
      });
      setOauthLoading(false);
    }
  };

  const disconnectGmail = async () => {
    if (!credentials) return;

    try {
      const { error } = await supabase
        .from('gmail_credentials')
        .delete()
        .eq('id', credentials.id);

      if (error) {
        throw new Error(error.message);
      }

      setCredentials(null);
      toast({
        title: "موفق",
        description: "Gmail disconnected successfully",
      });
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || 'Failed to disconnect Gmail',
        variant: "destructive"
      });
    }
  };

  const filteredLogs = emailLogs.filter(log => 
    log.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.courses?.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.chat_users?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isTokenExpired = credentials ? new Date(credentials.token_expires_at) <= new Date() : false;

  return (
    <div className="space-y-6">
      {/* Gmail Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gmail Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {credentials ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Gmail Connected</p>
                    <p className="text-sm text-gray-600">{credentials.email_address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isTokenExpired && (
                    <Badge variant="destructive">Token Expired</Badge>
                  )}
                  <Badge variant="outline">
                    Connected {new Date(credentials.created_at).toLocaleDateString('fa-IR')}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={connectGmail}
                  disabled={oauthLoading}
                >
                  {oauthLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    'Refresh Connection'
                  )}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={disconnectGmail}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <XCircle className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">Gmail Not Connected</p>
                  <p className="text-sm text-gray-600">
                    Connect your Gmail account to send automatic enrollment emails
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={connectGmail}
                disabled={oauthLoading}
              >
                {oauthLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Connect Gmail Account
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Email Logs</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchEmailLogs}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Logs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Course/User</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {loading ? 'Loading...' : 'No emails found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge 
                          variant={log.status === 'success' ? 'default' : 'destructive'}
                          className="gap-1"
                        >
                          {log.status === 'success' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {log.status === 'success' ? 'Sent' : 'Failed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.recipient}
                      </TableCell>
                      <TableCell>{log.subject}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.courses?.title && (
                            <div className="font-medium">{log.courses.title}</div>
                          )}
                          {log.chat_users?.name && (
                            <div className="text-gray-500">{log.chat_users.name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(log.created_at).toLocaleDateString('fa-IR')}
                        </div>
                        {log.error_message && (
                          <div className="text-red-500 text-xs mt-1">
                            {log.error_message}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSettings;