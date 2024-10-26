'use client';
import { useRef, useState } from 'react';
import { pushGroup } from '@/app/actions';
import { useFormStatus } from 'react-dom';
import { redirect } from 'next/navigation';
import { router } from 'next/client';
import { revalidatePath } from 'next/cache';
export default function NewGroup() {
  return (
    <main>
      <Form></Form>
    </main>
  );
}
//form for creating a new group
function Form() {
  'use client';
  const formRef = useRef<HTMLFormElement>(null);
  const status = useFormStatus();
  const [message, setMessage] = useState<string | undefined>();
  return (
    <main className='flex min-h-screen justify-center'>
      <form
        action={async (form: FormData) => {
          formRef.current?.reset();
          if (form.get('name')?.length === 0) {
            setMessage('Name too short');
          } else if (form.get('description')?.length === 0) {
            setMessage('Description too short');
          } else {
            const formResult = await pushGroup(form);
            if (formResult.success) {
              //redirect to new group page
              redirect('/groups/' + formResult.groupId);
            } else {
              setMessage(formResult.message);
            }
          }
        }}
        ref={formRef}
        className='flex flex-col gap-5'
      >
        <p className='text-3xl font-bold'>Create a new group</p>
        <p className='text-xl'>
          You can create events, invite members, hold group chats and more.
        </p>
        <label className='form-control'>
          <div className='label'>
            <span className='label-text'>Name of the group</span>
          </div>
          <input placeholder='Name' name='name' type='text' className='input' />
        </label>
        <label className='form-control'>
          <div className='label'>
            <span className='label-text'>Description</span>
          </div>
          <input
            name='Description'
            placeholder='description'
            type='text'
            className='input'
          />
        </label>
        <input type='submit' value='Create' className='btn' />
        {message ? <Message error={true} message={message}></Message> : null}
        {status.pending ? <Message message='Adding...'></Message> : null}
      </form>
    </main>
  );
}

type MessageProps = {
  message: string;
  error?: boolean;
};

function Message(props: MessageProps) {
  return (
    <p className={`${props.error ? 'text-red-500' : 'text-green-500'}`}>
      {props.message}
    </p>
  );
}
