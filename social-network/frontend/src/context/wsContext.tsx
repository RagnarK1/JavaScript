'use client';
import { authenticateWebsocket } from '@/app/actions';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useSessionContext } from '@/context/sessionContext';

type MessageType = {
  // Define your message type here
  content: string;
  type: string;
  data: any;
  // Other fields...
};

type NotificationType = {
  // Define your notification type here
  content: string;
  // Other fields...
};

type WebSocketContextType = {
  message: MessageType | null;
  notifications: NotificationType[];
  sendMessage: (data: any) => void;
  updateChat: boolean;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: any }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [message, setMessage] = useState<MessageType | null>(null);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [shouldReconnect, setShouldReconnect] = useState(true);
  const [updateChat, setUpdateChat] = useState(false); //toggle between to update
  const sessionContext = useSessionContext();
  const connectWebSocket = useCallback(
    async function connectWebSocket() {
      console.log(
        'Connecting to websockets with session ',
        sessionContext?.session || 'None'
      );
      if (!sessionContext?.session) {
        return;
      }
      const json = await authenticateWebsocket();
      if (json && json.body) {
        const token = json.body; // Assuming the token is in the 'body' field
        const ws = new WebSocket(`ws://localhost:8080/api/ws?token=${token}`);

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'new_message') {
            setMessage(data as MessageType);
          } else if (data.type === 'notification') {
            setNotifications((prev) => [...prev, data as NotificationType]);
            setUpdateChat((prev) => !prev);
          }
        };
        ws.onclose = () => {
          if (shouldReconnect) {
            // Reconnect with a delay
            setTimeout(connectWebSocket, 3000); // 3 seconds delay
          }
        };
        ws.onerror = () => {
          ws.close(); // Ensure socket is closed before attempting to reconnect
        };
        setSocket(ws);
      }
    },
    [shouldReconnect, sessionContext?.session]
  );
  useEffect(() => {
    connectWebSocket().then();

    return () => {
      setShouldReconnect(false);
      setSocket((socket) => {
        socket?.close();
        return null;
      });
    };
  }, [connectWebSocket]);

  const sendMessage = useCallback(
    (data: any) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
      }
    },
    [socket]
  );

  const value = {
    message,
    notifications,
    sendMessage,
    updateChat,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
