import { Post } from '@/models/post';
import Link from 'next/link';
import Image from 'next/image';

export default async function PostElement({ children }: { children: Post }) {
  const date = new Date((children.timestamp || 0) * 1000);
  let today = isToday(date);
  return (
    <div className='flex flex-col items-center justify-center hover:cursor-pointer'>
      <div className='card mb-5 w-[90vw] bg-white  shadow-xl'>
        <div className='card-body relative'>
          <div>
            <div className='card-title'>
              <Link
                className='h-full w-full hover:italic'
                href={`/post/view/${children.id}`}
              >
                {children.title}
              </Link>
            </div>
            <p className='relative text-sm'>
              Posted {today ? 'Today' : date.toDateString()}
              <Link
                className='z-1 absolute ml-2 hover:italic'
                href={`/profile/${children.creatorId}`}
              >
                {`by ${children.firstname} ${children.lastname}`}
              </Link>
            </p>
          </div>
          <p>{children.content}</p>
          {children.imagePath ? (
            <img
              src={children.imagePath || ''}
              alt={''}
              width={300}
              height={300}
            ></img>
          ) : null}
        </div>
      </div>
    </div>
  );
}
function isToday(date: Date) {
  const today = new Date();
  const givenDate = new Date(date);

  return (
    givenDate.getDate() === today.getDate() &&
    givenDate.getMonth() === today.getMonth() &&
    givenDate.getFullYear() === today.getFullYear()
  );
}
