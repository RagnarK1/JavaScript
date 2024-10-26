'use server';
import { authedFetch } from '@/utils';
import { GroupInvite } from '@/models/groupInvite';
import { generateRandomSixDigitNumber } from '@/clientUtils';
import { getSession } from '@/session';
import { Group } from '@/models/group';
import { acceptInvite, denyInvite, inviteGroupMember } from '@/app/actions';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export async function requestJoin(formData: FormData) {
  const groupId = formData.get('groupId');
  const userId = formData.get('userId');
  if (groupId) {
    const result = await inviteGroupMember(
      parseInt(groupId as string),
      parseInt(userId! as string),
      true
    );
    if (result.status) {
      revalidatePath('/groups/' + groupId);
    }
  }
}

async function getRequests(
  groupId: number
): Promise<GroupInvite[] | undefined> {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/groupRequests?groupId=' + groupId
  );
  if (result.ok) {
    let json = await result.json();
    return json.body;
  }
}
async function getInvites(groupId: number): Promise<GroupInvite[] | undefined> {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/groupInvites?groupId=' + groupId
  );
  if (result.ok) {
    let json = await result.json();
    return json.body;
  }
}
export async function GroupInvites({
  children,
  isOwner,
  isMember,
}: {
  children: Group | undefined;
  isOwner: boolean;
  isMember: boolean;
}) {
  if (children && children.id) {
    const session = await getSession();
    const invites = await getInvites(children.id);
    const requests = await getRequests(children.id);
    const isInvited = invites?.find((item) => item.userId === session?.id);
    const isRequested = requests?.find((item) => item.userId === session?.id);
    return (
      <div className=''>
        {isOwner ? (
          <div>
            {invites && invites.length !== 0 ? (
              <p className='text-xl font-bold'>Invites</p>
            ) : null}
            {invites?.map((invite) => (
              <div key={generateRandomSixDigitNumber()}>
                <div className='avatar flex flex-row items-center gap-3'>
                  <div className='w-16 rounded-full'>
                    <img
                      src={
                        invite.avatarPath
                          ? invite.avatarPath
                          : '/placeholder.png'
                      }
                    />
                  </div>
                  <Link
                    className='font-bold hover:cursor-pointer hover:italic'
                    href={`/profile/${invite.userId}`}
                  >{`${invite.firstname} ${invite.lastname}`}</Link>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <div>
          {isOwner ? (
            <>
              {requests?.map((invite) => (
                <div
                  className='flex flex-row'
                  key={generateRandomSixDigitNumber()}
                >
                  <form className='flex flex-row items-center gap-5'>
                    <p className='text-xl font-bold'>Requests</p>
                    <div className='avatar flex flex-row items-center gap-3'>
                      <div className='w-16 rounded-full'>
                        <img
                          src={
                            invite.avatarPath
                              ? invite.avatarPath
                              : '/placeholder.png'
                          }
                        />
                      </div>
                      <Link
                        href={`/profile/${invite.userId}`}
                        className='font-bold'
                      >{`${invite.firstname} ${invite.lastname}`}</Link>
                    </div>
                    <input
                      hidden
                      defaultValue={children.id}
                      name='groupId'
                    ></input>
                    <input
                      hidden
                      defaultValue={invite.userId}
                      name='userId'
                    ></input>
                    <button
                      formAction={acceptInvite}
                      className='btn btn-success'
                    >
                      Accept
                    </button>
                    <button formAction={denyInvite} className='btn btn-error'>
                      Deny
                    </button>
                  </form>
                </div>
              ))}
            </>
          ) : null}
        </div>
        {isInvited ? (
          <div className='flex flex-row items-center gap-3'>
            <p className='text-green-500'>
              You have been invited to this group
            </p>
            <form className='flex flex-row gap-3'>
              <input hidden defaultValue={children.id} name='groupId'></input>
              <button formAction={acceptInvite} className='btn btn-success'>
                Accept
              </button>
              <button formAction={denyInvite} className='btn btn-error'>
                Decline
              </button>
            </form>
          </div>
        ) : null}
        {isRequested ? (
          <p className='text-green-500'>
            You already requested to join this group
          </p>
        ) : !isOwner ? (
          isInvited ? null : isMember ? null : (
            <form>
              <input
                hidden
                type='number'
                readOnly
                defaultValue={children.id}
                name='groupId'
              ></input>
              <input
                hidden
                type='number'
                readOnly
                value={session!.id}
                name='userId'
              ></input>
              <p className='text-sm font-light'>
                You are not part of this group. You can request the owner to
                join.
              </p>
              <button
                type='submit'
                formAction={requestJoin}
                className='btn btn-primary'
              >
                Request to join
              </button>
            </form>
          )
        ) : null}
      </div>
    );
  }
  return null;
}
