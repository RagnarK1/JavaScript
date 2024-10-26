'use client';
import { User } from '@/models/user';
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import { ChatContextProvider } from '@/context/chatContext';
import { usePathname } from 'next/navigation';
import { getSession } from '@/session';

type SessionContextType = {
  session: User | null | undefined;
  setSession: Dispatch<SetStateAction<User | null | undefined>>;
};

const SessionContext = createContext<SessionContextType | null>(null);

export const useSessionContext = () => {
  return useContext(SessionContext);
};

export function SessionContextProvider({ children }: { children: any }) {
  const [session, setSession] = useState<User | null>();
  const pathname = usePathname();
  useEffect(() => {
    getSession().then((result) => {
      setSession(result);
    });
  }, [pathname]);
  const value = {
    session,
    setSession,
  };
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
