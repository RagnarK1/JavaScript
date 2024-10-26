import { pullParticipatingGroups, pushPost } from '@/app/actions';
import ImageUploader from '@/components/imageUpload';
import PostPrivacySelector from '@/components/chooseFollowers';

export default async function NewPost() {
  const relations = await pullParticipatingGroups();
  //TODO: need to pull followers and display them when choosing privacy
  return (
    <main className='flex min-h-screen justify-center'>
      <form className='flex flex-col gap-5'>
        <Item
          label={'Title'}
          name={'title'}
          alt='Choose a title to your new post'
          short={true}
        ></Item>
        <Item
          label={'Content'}
          name={'content'}
          alt='Add content to your post'
        ></Item>
        <PostPrivacySelector></PostPrivacySelector>
        <label className='form-control max-w-xs'>
          <div className='label'>
            <span className='label-text'>Target group</span>
          </div>
          <select name='group' className='select select-primary'>
            <option value={0}>Keep it public</option>
            {relations?.map((relation: any) => (
              <option key={relation.groupId} value={relation.groupId}>
                {relation.groupName}
              </option>
            ))}
          </select>
        </label>
        <ImageUploader labelText='Add image to your post' />
        <button
          className='btn max-w-xs'
          type='submit'
          value='Submit'
          formAction={pushPost}
        >
          Submit
        </button>
      </form>
    </main>
  );
}

type ItemProps = {
  label: string;
  name: string;
  alt: string;
  short?: boolean;
};

function Item(props: ItemProps) {
  return (
    <label className='form-control max-w-xs'>
      <div className='label '>
        <span className='label-text'>{props.label}</span>
        <span className='label-text-alt'>{props.alt}</span>
      </div>
      {props.short ? (
        <input
          type='text'
          placeholder={props.label}
          name={props.name}
          className='input input-primary'
        />
      ) : (
        <textarea
          name={props.name}
          placeholder={props.label}
          className='textarea textarea-primary resize-none'
        ></textarea>
      )}
    </label>
  );
}
