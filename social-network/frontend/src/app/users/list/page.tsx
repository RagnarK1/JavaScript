//Show the list of users
//just for testing
import { authedFetch } from '@/utils';

async function getUsers() {
  const result = await authedFetch(process.env.NEXT_PUBLIC_BACKEND_HOST + '/allUsers');
}
export default async function UserList() {
  return <main></main>;
}
