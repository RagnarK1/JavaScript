'use server';
import { Group } from '@/models/group';
import { pushEvent } from '@/app/actions';
//Manages the events for specific group
export default async function EventManager(props: Props) {
  return (
    <form className='form-control mt-5'>
      <p className='text-3xl font-bold'>Create a new event</p>
      <label className='form-control'>
        <div className='label'>
          <span className='label-text'>Title</span>
        </div>
        <input type='text' className='input' placeholder='title' name='title' />
      </label>
      <label className='form-control'>
        <div className='label'>
          <span className='label-text'>Description</span>
        </div>
        <input
          className='input'
          type='text'
          placeholder='description'
          name='description'
        />
      </label>
      <input
        className='input'
        type='number'
        hidden={true}
        defaultValue={props.group.id}
        name='groupId'
      />
      <label className='form-control'>
        <div className='label'>
          <span className='label-text'>When does the event take place</span>
        </div>
        <input type='date' className='input' name='date' />
      </label>
      <button className='btn btn-primary' formAction={pushEvent}>
        Create event
      </button>
      <p
        className={`${
          props.searchParams.eventError ? 'text-red-500' : 'text-green-500'
        } `}
      >
        {props.searchParams.eventError}
      </p>
    </form>
  );
}
type Props = {
  group: Group;
  searchParams: { eventError?: string; message?: string };
};
//Manages the events for specific group
