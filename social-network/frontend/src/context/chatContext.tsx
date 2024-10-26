'use client';
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from 'react';

type ChatContextType = {
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
};

const ChatContext = createContext<ChatContextType | null>(null);
export const useChatContext = () => {
  return useContext(ChatContext);
};

export function ChatContextProvider({ children }: { children: any }) {
  const [show, setShow] = useState(true);
  const value = {
    show,
    setShow,
  };
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
