import { authedFetch } from '@/utils';
import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Post } from '@/models/post';
import PostElement from '@/components/post';
//Gets all the posts from database
async function getPosts() {
  const result = await authedFetch(process.env.NEXT_PUBLIC_BACKEND_HOST + '/posts', 'GET');
  if (result.ok) {
    let json = await result.json();
    return json.body as Post[];
  } else {
    if (result.status == 403) {
      redirect('/authentication/login');
    }
  }
}

async function getFeed() {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/feed?pageNum=1',
    'GET',
    undefined,
    'no-cache'
  );
  if (result.ok) {
    let json = await result.json();
    return json.body as Post[];
  } else {
    if (result.status == 403) {
      redirect('/authentication/login');
    }
  }
}

export default async function Home() {
  const posts = await getFeed();
  return (
    <main className='p-3'>
      {posts?.map((post) => <PostElement key={post.id}>{post}</PostElement>)}
      {posts && posts.length !== 0 ? null : (
        <p className='text-2xl font-bold'>No posts yet. Be the first one!</p>
      )}
    </main>
  );
}
