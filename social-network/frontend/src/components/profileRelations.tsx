'use client';
import { User } from '@/models/user';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { redirect, useRouter } from 'next/navigation';
import { router } from 'next/client';
import { Relationship } from '@/models/relationship';
import exp from 'node:constants';

//Show followings and followers
export default function ProfileRelations({
  children,
  followers,
  followings,
}: {
  followers: Relationship[];
  followings: Relationship[];
  children: User;
}) {
  const [expanded, setExpanded] = useState<{
    show: boolean;
    type: 'Followers' | 'Followings';
  }>({ show: false, type: 'Followers' }); //pops up the list of followers/followings
  const [users, setUsers] = useState<Relationship[] | undefined>([]);
  useEffect(() => {
    if (expanded.type === 'Followers') {
      setUsers(followers);
    } else {
      setUsers(followings);
    }
  }, [expanded, followers, followings]);
  return (
    <div className='flex flex-row gap-5'>
      <p
        onClick={() =>
          setExpanded((prev) => {
            return { show: !prev.show, type: 'Followers' };
          })
        }
        className='text-2xl font-bold hover:cursor-pointer'
      >
        Followers: <span className=''>{followers?.length || 0}</span>
      </p>
      <p
        onClick={() =>
          setExpanded((prev) => {
            return { show: !prev.show, type: 'Followings' };
          })
        }
        className='text-2xl font-bold hover:cursor-pointer'
      >
        Followings: <span className=''>{followings?.length || 0}</span>
      </p>
      {expanded.show ? (
        <div className='absolute left-[40vw] top-[10%] z-[50] h-[80vh] w-[20vw] overflow-auto rounded bg-blue-500'>
          <div className='flex flex-row justify-between'>
            <p className='text-4xl'>{expanded.type}</p>
            <button
              onClick={() => setExpanded({ show: false, type: 'Followers' })}
            >
              Close
            </button>
          </div>
          <div className='flex flex-col items-start gap-1 p-3'>
            {users?.map((r) => (
              <div
                key={r.avatarPath}
                className='avatar flex flex-row items-center gap-1 font-bold'
              >
                <div className='w-12 rounded-full'>
                  <img src={r.avatarPath || '/placeholder.png'} />
                </div>
                <Link
                  className='hover:italic'
                  href={`/profile/${
                    expanded.type === 'Followers' ? r.FollowerId : r.FollowingId
                  }`}
                >{`${r.firstname} ${r.lastname}`}</Link>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Member({ children }: { children: User }) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push('/profile/' + children.id)}
      className='avatar relative flex flex-row items-center hover:cursor-pointer'
    >
      <div className='mr-2 w-16 rounded-full'>
        <img src='https://daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg' />
      </div>
      <p>{`${children.firstname} ${children.lastname}`}</p>
    </div>
  );
}
