import { authedFetch } from '@/utils';
import { getSession } from '@/session';
import AcceptEventInvite from '@/components/acceptEventInvite';
import Link from 'next/link';

async function pullEventRelations(eventId: number) {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/eventRelationships?eventId=' + eventId
  );
  if (result.ok) {
    let json = await result.json();
    return json.body;
  }
}
export default async function EventMembers({
  eventId,
  groupId,
}: {
  eventId: number;
  groupId: number;
}) {
  const relations = await pullEventRelations(eventId);
  const session = await getSession();
  return (
    <div>
      <p className='text-xl font-bold'>See who plans to attend</p>
      {relations.map((member: any) => (
        <div className='flex flex-row gap-3' key={member.id}>
          <div className='flex flex-row items-center gap-5'>
            <div className='avatar'>
              <div className='w-12 rounded-full'>
                <img
                  src={
                    member.avatarPath ? member.avatarPath : '/placeholder.png'
                  }
                />
              </div>
            </div>
            <Link
              className='font-bold hover:cursor-pointer hover:italic'
              href={`/profile/${member.id}`}
            >{`${member.firstname} ${member.lastname}`}</Link>
            <p>
              {member.status === 1
                ? 'Invited'
                : member.status === 2
                  ? 'Going'
                  : 'Not going'}
            </p>
            {session?.id === member.userId ? (
              member.status === 1 ? (
                <AcceptEventInvite
                  eventId={eventId}
                  session={session}
                  params={{ id: groupId }}
                ></AcceptEventInvite>
              ) : null
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
