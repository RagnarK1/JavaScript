import { authedFetch } from '@/utils';
import { Group } from '@/models/group';
import { generateRandomSixDigitNumber } from '@/clientUtils';
import { isAuthed } from '@/app/actions';
import Link from 'next/link';

async function pullAllGroups(): Promise<Group[] | undefined> {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/allGroups',
    'GET',
    undefined,
    'no-cache'
  );
  if (result.ok) {
    let json = await result.json();
    return json.body;
  }
}
export default async function Page() {
  const groups = await pullAllGroups();
  return (
    <main className='flex flex-col gap-5 p-3'>
      <p className='text-xl font-bold'>Find a new group to join</p>
      {groups?.map((group) => (
        <Group key={generateRandomSixDigitNumber()} group={group}></Group>
      ))}
    </main>
  );
}

function Group({ group }: { group: Group }) {
  return (
    <div className='card w-96 bg-base-100 shadow-xl'>
      <div className='card-body'>
        <h2 className='card-title'>{group.name}</h2>
        <p>{group.description}</p>
        <div className='card-actions justify-end'>
          <Link href={`/groups/${group.id}`} className='btn btn-primary'>
            Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
