import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ReplyMessage {
  id: number;
  message: string;
  sender_name: string;
}

interface ReplyContextType {
  replyingTo: ReplyMessage | null;
  setReplyingTo: (message: ReplyMessage | null) => void;
}

const ReplyContext = createContext<ReplyContextType | undefined>(undefined);

export const useReply = () => {
  const context = useContext(ReplyContext);
  if (!context) {
    throw new Error('useReply must be used within a ReplyProvider');
  }
  return context;
};

interface ReplyProviderProps {
  children: ReactNode;
}

export const ReplyProvider: React.FC<ReplyProviderProps> = ({ children }) => {
  const [replyingTo, setReplyingTo] = useState<ReplyMessage | null>(null);

  return (
    <ReplyContext.Provider value={{ replyingTo, setReplyingTo }}>
      {children}
    </ReplyContext.Provider>
  );
};