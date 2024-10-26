'use client';
import React, { useEffect, useState } from 'react';
import { inviteGroupMember, searchUser } from '@/app/actions';
import { User } from '@/models/user';
import Link from 'next/link';
type Props = {
  groupId: number;
};
export default function InviteMembers(props: Props) {
  const [searchText, setSearchText] = useState('');
  const [message, setMessage] = useState({
    error: false,
    message: '',
    show: false,
  });
  const [results, setResults] = useState<User[]>([]);
  const inviteMember = async (userId: number) => {
    let result = await inviteGroupMember(props.groupId, userId);
    if (result.status) {
      setMessage({ error: false, message: result.message, show: true });
      return true;
    } else {
      setMessage({ error: true, message: result.message, show: true });
      return false;
    }
  };
  useEffect(() => {
    async function search() {
      const result = await searchUser(searchText);
      if (result) {
        setResults(result);
      }
    }
    search().then();
  }, [searchText]);
  return (
    <div>
      <label className='form-control'>
        <div className='label'>
          <span className='label-text'>Search for others to invite</span>
        </div>
        <input
          className='input'
          type='text'
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder='Search by name'
        />
      </label>
      {message.show ? (
        <p className={`${message.error ? 'text-red-500' : 'text-green-500'} `}>
          {message.message}
        </p>
      ) : null}
      <Results users={results} inviteMember={inviteMember}></Results>
    </div>
  );
}
type ResultProps = {
  users: User[];
  inviteMember: (userId: number) => Promise<boolean>;
};
function Results(props: ResultProps) {
  return (
    <div className='mt-1'>
      {props.users.map((user) => (
        <InvitableUser key={user.id} inviteMember={props.inviteMember}>
          {user}
        </InvitableUser>
      ))}
    </div>
  );
}

//TODO: Load profile picture instead of placeholder
function InvitableUser({
  inviteMember,
  children,
}: {
  inviteMember: (id: number) => Promise<boolean>;
  children: User;
}) {
  const [isInvited, setIsInvited] = useState(false);
  return (
    <div
      className='flex w-[20vw] flex-row items-center justify-between'
      key={children.id}
    >
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
      <button
        onClick={async () => {
          if (isInvited) {
            return;
          }
          const result = await inviteMember(children.id);
          setIsInvited(result);
        }}
        className='btn btn-success'
      >
        {isInvited ? 'Invited!' : 'Invite'}
      </button>
    </div>
  );
}
