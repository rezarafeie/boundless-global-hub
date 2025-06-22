import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient } from 'react-query';
import BorderlessHub from './pages/BorderlessHub';
import BorderlessHubAdmin from './pages/BorderlessHubAdmin';
import BorderlessHubLogin from './pages/BorderlessHubLogin';
import BorderlessHubRegister from './pages/BorderlessHubRegister';
import BorderlessHubMessenger from './pages/BorderlessHubMessenger';
import BorderlessHubProfile from './pages/BorderlessHubProfile';
import BorderlessHubTopics from './pages/BorderlessHubTopics';
import BorderlessHubTopic from './pages/BorderlessHubTopic';
import BorderlessHubLive from './pages/BorderlessHubLive';
import RafieiMeet from './pages/RafieiMeet';
import { RafieiMeetProvider } from './contexts/RafieiMeetContext';

function App() {
  return (
    <QueryClient>
      <div className="App">
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<BorderlessHub />} />
            <Route path="/hub" element={<BorderlessHub />} />
            <Route path="/hub/login" element={<BorderlessHubLogin />} />
            <Route path="/hub/register" element={<BorderlessHubRegister />} />
            
            {/* Member Routes */}
            <Route path="/hub/profile" element={<BorderlessHubProfile />} />
            <Route path="/hub/topics" element={<BorderlessHubTopics />} />
            <Route path="/hub/topic/:id" element={<BorderlessHubTopic />} />
            
            {/* Rafiei Meet Route */}
            <Route path="/hub/meet" element={
              <RafieiMeetProvider>
                <RafieiMeet />
              </RafieiMeetProvider>
            } />

            {/* Live Stream Route */}
            <Route path="/hub/live" element={<BorderlessHubLive />} />

            {/* Messenger Route */}
            <Route path="/hub/messenger" element={<BorderlessHubMessenger />} />
            
            {/* Admin Routes */}
            <Route path="/hub/admin" element={<BorderlessHubAdmin />} />
            
            {/* Remove the old messenger admin route - it's now merged into /hub/admin */}
          </Routes>
        </BrowserRouter>
      </div>
    </QueryClient>
  );
}

export default App;
