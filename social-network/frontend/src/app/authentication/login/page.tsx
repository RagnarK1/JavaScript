import React from 'react';
import { login } from '@/app/actions';
import Link from 'next/link';

const errorMessages: any = {
  invalid: 'Invalid credentials',
  server: 'Server error',
};

export default function Login({ searchParams }: { searchParams: any }) {
  const isError = !!searchParams.error;
  return (
    <div className='flex flex-col items-center'>
      <p className='text-4xl font-bold'>Login</p>
      <form className='flex flex-col gap-5'>
        <label className='form-control'>
          <div className='label'>
            <span className='label-text'>Email</span>
          </div>
          <input
            name='email'
            type='text'
            className='input'
            placeholder='Email'
          />
        </label>
        <label className='form-control'>
          <div className='label'>
            <span className='label-text'>Password</span>
          </div>
          <input
            name='password'
            type='password'
            className='input'
            placeholder='Password'
          />
        </label>
        <button type='submit' className='btn ' formAction={login}>
          Login
        </button>
      </form>
      <Link className='link' href='/authentication/register'>
        Register instead
      </Link>
      {isError ? (
        <div role='alert' className='alert alert-error mt-5 w-[20vw]'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-6 w-6 shrink-0 stroke-current'
            fill='none'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          <span>{errorMessages[searchParams.error]}</span>
        </div>
      ) : null}
    </div>
  );
}
