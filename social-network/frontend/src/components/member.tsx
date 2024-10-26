import { User } from '@/models/user';
import Link from 'next/link';
import React from 'react';

export async function Member({ children }: { children: User }) {
  return (
    <div className='flex w-[20vw] flex-row items-center hover:scale-105'>
      <div className='avatar mr-2'>
        <div className='w-16 rounded-full'>
          <img
            src={children.avatarPath ? children.avatarPath : '/placeholder.png'}
          />
        </div>
      </div>
      <Link
        href={`/profile/${children.id}`}
        className='text-xl'
      >{`${children.firstname} ${children.lastname}`}</Link>
    </div>
  );
}
