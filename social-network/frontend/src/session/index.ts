'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { User } from '@/models/user';
import { decrypt, encrypt } from '@/session/encrypt';

export const getSession = async (): Promise<User | null> => {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get('user');

    if (session?.value) {
      try {
        const decrypted = decrypt(session.value);
        return JSON.parse(decrypted) as User;
      } catch {
        // Ignore invalid session
      }
    }

    return null;
  } catch (e) {
    console.log(e);
    return null;
  }
};

//adding the user object to the cookies
export const setSession = async (session: User) => {
  const cookieStore = cookies();
  const encrypted = encrypt(JSON.stringify(session));
  cookieStore.set('user', encrypted);
};

export const removeSession = async () => {
  const cookieStore = cookies();
  console.log('deleting user cookie');
  cookieStore.delete('user');
};

export const signIn = async (user: User) => {
  await setSession(user);
};

export const signOut = async (form: FormData) => {
  await removeSession();
  redirect('/login');
};
