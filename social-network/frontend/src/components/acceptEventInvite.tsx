import { User } from '@/models/user';
import { acceptEvent } from '@/app/actions';
import { param } from 'ts-interface-checker';
type Props = {
  session: User | null;
  eventId: number;
  params: {
    id: number;
  };
};

export default async function AcceptEventInvite(props: Props) {
  if (props.session) {
    return (
      <div className='flex flex-row gap-3'>
        <form>
          <input
            type='number'
            hidden={true}
            defaultValue={props.eventId}
            name='eventId'
          />
          <input type='number' hidden={true} defaultValue={2} name='status' />
          <input
            type='number'
            hidden={true}
            defaultValue={props.params.id}
            name='groupId'
          />
          <button formAction={acceptEvent} className='btn btn-success'>
            GOING
          </button>
        </form>
        <form>
          <input
            type='number'
            hidden={true}
            defaultValue={props.eventId}
            name='eventId'
          />
          <input type='number' hidden={true} defaultValue={0} name='status' />
          <input
            type='number'
            hidden={true}
            defaultValue={props.params.id}
            name='groupId'
          />
          <button formAction={acceptEvent} className='btn btn-warning'>
            NOT GOING
          </button>
        </form>
      </div>
    );
  }
  return null;
}
