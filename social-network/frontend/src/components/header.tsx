'use client';
import Link from 'next/link';
import { logout } from '@/app/actions';
import Notifications from '@/components/notifications';
import { useChatContext } from '@/context/chatContext';
import { useSessionContext } from '@/context/sessionContext';
import Image from 'next/image';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

//declare component as client, then call the server action inside arrow function
export default function Header() {
  const chatContext = useChatContext();
  const sessionContext = useSessionContext();
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.includes('authentication/')) {
      sessionContext?.setSession(null);
    }
  }, [pathname, sessionContext]);
  if (sessionContext?.session) {
    return (
      <header className='z-100 mr-5 flex flex-row justify-between bg-blue-500 lg:mr-0'>
        <div className='flex flex-row items-center justify-center gap-5'>
          <Link href='/' className='btn btn-ghost'>
            Home
          </Link>
          <div className='dropdown dropdown-hover'>
            <div tabIndex={0} role='button' className='btn btn-ghost m-1'>
              Groups
            </div>
            <ul
              tabIndex={0}
              className='menu dropdown-content rounded-box z-[1] w-52 bg-base-100 p-2 shadow'
            >
              <li>
                <Link href='/groups/new'>New Group</Link>
              </li>
              <li>
                <Link href='/groups/all'>All groups</Link>
              </li>
            </ul>
          </div>
          <div className='dropdown-hover dropdown'>
            <div tabIndex={1} role='button' className='btn btn-ghost m-1'>
              Posts
            </div>
            <ul
              tabIndex={1}
              className='menu dropdown-content rounded-box z-[1] w-52 bg-base-100 p-2 shadow'
            >
              <li>
                <Link href='/post/new'>New Post</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className='flex flex-row items-center gap-2'>
          <Notifications></Notifications>
          <button
            className='btn btn-ghost'
            onClick={() => chatContext?.setShow((prev) => !prev)}
          >
            Chat
          </button>
          <Link href={`/profile/${sessionContext.session.id}`}>
            <img
              src={'/profile.png'}
              alt={'profile'}
              width={20}
              height={20}
            ></img>{' '}
          </Link>
          <form action={logout}>
            <button className='flex items-center'>
              <img
                src={'/logout.png'}
                alt={'logout'}
                width={20}
                height={20}
              ></img>
            </button>
          </form>
        </div>
      </header>
    );
  }
  return null;
}
