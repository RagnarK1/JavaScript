'use client';
import { deleteNotification, pullNotifications } from '@/app/actions';
import { useWebSocket } from '@/context/wsContext';
import { Notification } from '@/models/notification';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from 'next/image';

//Pulls notifications and renders them  on the UI
export default function Notifications() {
  const { notifications } = useWebSocket();
  const [notifications2, setNotifications] = useState<Notification[]>([]);

  async function getResult() {
    const result = await pullNotifications();
    if (result) {
      setNotifications(result);
    }
  }
  useEffect(() => {
    getResult().then();
  }, [notifications]);
  return (
    <div className='dropdown-hover dropdown'>
      <div className='indicator '>
        {notifications2.length > 0 ? (
          <span className='indicator-bottom badge indicator-item badge-secondary'>
            {notifications2.length}
          </span>
        ) : null}
        <div tabIndex={0} role='button' className='btn btn-ghost m-1'>
          Notifications
        </div>
      </div>
      <ul
        tabIndex={0}
        className='menu dropdown-content rounded-box z-[100] mr-5 w-[18vw] bg-base-100 p-2 shadow'
      >
        {notifications2.length === 0 ? (
          <p>No notifications!</p>
        ) : (
          notifications2.map((not) => (
            <Notification
              key={not.id}
              notification={not}
              deleteNotification={deleteNotification}
              setNotifications={setNotifications}
            ></Notification>
          ))
        )}
      </ul>
    </div>
  );
}

function Notification({
  notification,
  deleteNotification,
  setNotifications,
}: {
  notification: Notification;
  deleteNotification: any;
  setNotifications: any;
}) {
  return (
    <li className='flex flex-row justify-between' key={notification.id}>
      <div className='flex w-full flex-row items-center justify-between'>
        <button
          onClick={async () => {
            deleteNotification(notification.id);
            setNotifications((await pullNotifications()) || []);
          }}
        >
          <img width={15} height={15} src={'/close.png'} alt={'close'}></img>
        </button>
        <Link href={notification.link}>{notification.message}</Link>
      </div>
    </li>
  );
}
