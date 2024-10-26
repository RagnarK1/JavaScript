import {
  pullComments,
  pullPost,
  pullProfile,
  pushComment,
} from '@/app/actions';
import { Comment } from '@/models/comment';
import Image from 'next/image';
import ImageUploader from '@/components/imageUpload';
import React from 'react';
import Link from 'next/link';

export default async function Page({
  params,
  searchParams,
}: {
  params: { id: number };
  searchParams: { error: string };
}) {
  const post = await pullPost(params.id);
  if (post.success && post.post) {
    const commentsResult = await pullComments(post.post.id!);
    const creatorProfile = await pullProfile(post.post?.creatorId || 0);
    const date = new Date((post.post.timestamp || 0) * 1000);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return (
      <div className='flex flex-col items-center justify-center'>
        <div className='card mb-5 w-[90vw] shadow-xl'>
          <div className='card-body'>
            <h2 className='card-title'>{post.post.title}</h2>
            <div className='avatar flex flex-row items-center gap-1'>
              <div className='w-8 rounded-full'>
                <img src={creatorProfile?.avatarPath || '/placeholder.png'} />
              </div>
              <Link
                href={`/profile/${creatorProfile!.id}`}
                className='hover:italic'
              >
                Posted by {creatorProfile?.firstname} {creatorProfile?.lastname}
              </Link>
              <p>on {new Intl.DateTimeFormat('en-GB', options).format(date)}</p>
            </div>
            <p>{post.post.content}</p>
            {post.post.imagePath ? (
              <img
                src={post.post.imagePath || ''}
                alt={''}
                width={300}
                height={300}
              ></img>
            ) : null}
          </div>
        </div>
        <section>
          <section className='flex flex-col gap-5'>
            <p className='text-xl'>Comments</p>
            {commentsResult.comments?.map((comment) => (
              <Comment key={comment.id}>{comment}</Comment>
            ))}
          </section>
        </section>
        <section className='mb-5 mt-5 flex flex-col gap-5'>
          <form encType='multipart/form-data'>
            <textarea
              name='content'
              className='textarea w-full resize-none'
              placeholder='Your comment here'
            ></textarea>
            <div className='flex flex-row items-end gap-5'>
              <ImageUploader labelText='Add image to your comment' />
              <input hidden name='postId' defaultValue={post.post.id}></input>
              <button formAction={pushComment} className='btn'>
                Add comment
              </button>
            </div>
          </form>
        </section>
        {searchParams.error ? (
          <p className='text-red-500'>{searchParams.error}</p>
        ) : null}
      </div>
    );
  } else {
    return <div>Post not found</div>;
  }
}

function Comment({ children }: { children: Comment }) {
  return (
    <div className='card card-side w-[90vw] bg-base-100 shadow-xl'>
      <div className='card-body'>
        <h3 className='card-title'>Comment by {children.firstname}</h3>
        <div className='flex flex-row'>
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
