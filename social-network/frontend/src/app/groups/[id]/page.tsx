'use server';
import {
  pullGroupDetails,
  pullGroupMembers,
  pullPostsByGroupId,
} from '@/app/actions';
import InviteMembers from '@/components/inviteMembers';
import { GroupInvites } from '@/components/groupInvites';
import ShowEvents from '@/components/showEvents';
import EventManager from '@/components/eventManager';
import { User } from '@/models/user';
import React from 'react';
import { getSession } from '@/session';
import Link from 'next/link';
import PostElement from '@/components/post';
import Collapse from '@/components/dropdown';
import { Member } from '@/components/member';

//Display group data based on ?id= parameter
export default async function ViewGroup({
  params,
  searchParams,
}: {
  params: { id: number };
  searchParams: { error: string };
}) {
  const groupDetails = await pullGroupDetails(params.id);
  const members: User[] | undefined = await pullGroupMembers(params.id);
  const owner = await getSession();
  const isOwner = groupDetails?.creatorId === owner?.id;
  const isMember = members?.find((member) => member.id === owner?.id);
  const posts = await pullPostsByGroupId(groupDetails?.id || 0);
  if (groupDetails && owner) {
    return (
      <main className='flex flex-col gap-5 p-3'>
        <div>
          <p className='text-6xl'>{groupDetails.name}</p>
          {isOwner ? (
            <p className='text-gray-600'>You are the owner of this group.</p>
          ) : null}
          <p className='mt-5 text-lg'>{groupDetails.description}</p>
        </div>
        {isMember ? (
          <React.Fragment>
            <Collapse title={'Members'}>
              {members?.map((member) => {
                return <Member key={member.id}>{member}</Member>;
              })}
              {groupDetails.creatorId === owner.id ? (
                <InviteMembers groupId={groupDetails.id!}></InviteMembers>
              ) : null}
            </Collapse>
            <Collapse title='Posts'>
              {posts?.map((post) => {
                return <PostElement key={post.id}>{post}</PostElement>;
              })}
              {posts && posts.length !== 0 ? null : <p>No posts available</p>}
            </Collapse>
          </React.Fragment>
        ) : (
          <p className='text-2xl'>
            Become a member first to see more about group. You can request to
            join or be invited.
          </p>
        )}
        <Collapse title={'Manage memberships'}>
          <GroupInvites isMember={!!isMember} isOwner={isOwner}>
            {groupDetails}
          </GroupInvites>
        </Collapse>
        {isMember ? (
          <React.Fragment>
            <Collapse title={'Events'}>
              <ShowEvents
                params={{ groupId: groupDetails.id || 0 }}
              ></ShowEvents>
              <EventManager
                searchParams={searchParams as any}
                group={groupDetails}
              ></EventManager>
            </Collapse>
          </React.Fragment>
        ) : null}
      </main>
    );
  }
  return null;
}
