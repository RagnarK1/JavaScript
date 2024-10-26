import React from 'react';
import { register } from '@/app/actions';
import Link from 'next/link';
import ImageUploader from '@/components/imageUpload';

const errorMessages: any = {
  exists: 'Account with same email or username already exists',
  server: 'Server error',
  invalid: 'Invalid form inputs',
  date: 'Invalid date of birth',
  email: 'Invalid email',
  tooYoung: 'You need to be at least 3 years of age',
};

export default function Register({ searchParams }: { searchParams: any }) {
  const isError = !!searchParams.error;
  return (
    <div className='flex flex-col items-center justify-center'>
      <form className='flex flex-col gap-5' encType='multipart/form-data'>
        <label className='form-control'>
          <div className='label'>
            <span className='label-text'>Email</span>
          </div>
          <input
            name='email'
            placeholder='Email'
            type='text'
            className='input'
          />
        </label>
        <label className='form-control'>
          <div className='label'>
            <span className='label-text'>Password</span>
          </div>
          <input
            placeholder='password'
            name='password'
            type='password'
            className='input'
          />
        </label>
        <label className='form-control'>
          <div className='label'>
            <span className='label-text'>Firstname</span>
          </div>
          <input
            name='firstname'
            type='text'
            placeholder='Firstname'
            className='input'
          />
        </label>
        <label className='form-control'>
          <div className='label'>
            <span className='label-text'>Lastname</span>
          </div>
          <input
            name='lastname'
            type='text'
            placeholder='Lastname'
            className='input'
          />
        </label>
        <label className='form-control'>
          <div className='label'>
            <span className='label-text'>Date of birth</span>
          </div>
          <input
            name='dob'
            type='date'
            placeholder='Date of birth'
            className='input'
          />
        </label>
        <label className='form-control'>
          <div className='label'>
            <span className='label-text'>Nickname</span>
          </div>
          <input
            name='nickname'
            type='text'
            placeholder='Nickname'
            className='input'
          />
        </label>
        <ImageUploader labelText='You can add a profile picture' />
        <label className='form-control'>
          <div className='label'>
            <span className='label-text'>About me</span>
          </div>
          <textarea
            className='textarea'
            name='aboutMe'
            placeholder='Write something about yourself'
            defaultValue=''
          ></textarea>
        </label>
        <button className='btn' formAction={register}>
          Register
        </button>
      </form>
      <Link className='link' href='/authentication/login'>
        Login instead
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
