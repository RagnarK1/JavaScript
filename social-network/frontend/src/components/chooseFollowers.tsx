'use client';
import React, { useEffect, useState } from 'react';
import { Relationship } from '@/models/relationship';
import { pullFollowData } from '@/app/actions';
import { useSessionContext } from '@/context/sessionContext';

export default function PostPrivacySelector() {
  const [value, setValue] = useState('0');
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (value === '2') setExpanded(true);
  }, [value]);
  return (
    <>
      <label className='form-control max-w-xs'>
        <div className='label'>
          <span className='label-text'>Privacy</span>
        </div>
        <select
          value={value}
          onChange={(event) => setValue(event.target.value)}
          name='privacy'
          className='select select-primary'
        >
          <option value='0'>Private</option>
          <option value='1'>Public</option>
          <option value='2'>Almost private</option>
        </select>
      </label>
      <ChooseFollowers
        expanded={expanded}
        close={() => setExpanded(false)}
      ></ChooseFollowers>
    </>
  );
}

export function ChooseFollowers(x: { expanded: boolean; close: () => void }) {
  //chosen followers will be set as json stringified array value
  const [followers, setFollowers] = useState<Relationship[]>([]);
  const [chosen, setChosen] = useState<number[]>([]);
  const sessionContext = useSessionContext();
  function done() {
    //get all the checked values
    // Filter followers to get only the ones that are checked
    const checkedFollowers = followers.filter((follower) =>
      chosen.includes(follower.FollowerId)
    );
    // Now you can do something with the checkedFollowers array
    // If you want to convert it to JSON string:
    x.close();
  }
  useEffect(() => {
    async function getResult() {
      if (sessionContext?.session) {
        const result = await pullFollowData(
          'followers',
          sessionContext.session.id
        );
        if (result) {
          setFollowers(result);
        }
      }
    }
    getResult().then();
  }, [sessionContext?.session]);
  //TODO: List the followers here
  return (
    <div
      className={`absolute left-[40vw] h-[50vh] w-[20vw] flex-col justify-between rounded-md bg-blue-500 p-2 ${x.expanded ? 'flex' : 'hidden'
        }`}
    >
      <p className='text-xl font-bold'>Choose allowed viewers</p>
      <input
        hidden={true}
        name='allowedViewers'
        value={JSON.stringify(chosen)}
      />
      <div className='flex flex-col items-start justify-start overflow-y-auto'>
        {followers.map((item) => (
          <Item key={item.Timestamp} chosen={chosen} setChosen={setChosen}>
            {item}
          </Item>
        ))}
      </div>
      <button onClick={done} type={'button'} className='btn w-1/2'>
        Done
      </button>
    </div>
  );
}

function Item({
  children,
  chosen,
  setChosen,
}: {
  children: Relationship;
  chosen: number[];
  setChosen: React.Dispatch<React.SetStateAction<number[]>>;
}) {
  const [checked, setChecked] = useState(false);
  const checkHandler = () => {
    setChecked(!checked);

    // Update the chosen state based on checked status
    if (checked) {
      // Remove the FollowerId from chosen when unchecked
      setChosen((prevChosen) =>
        prevChosen.filter((followerId) => followerId !== children.FollowerId)
      );
    } else {
      // Add the FollowerId to chosen when checked
      setChosen((prevChosen) => [...prevChosen, children.FollowerId]);
    }
  };
  return (
    <div className='form-control'>
      <label className='label cursor-pointer'>
        <span className='label-text'>{`${children.firstname} ${children.lastname}`}</span>
        <input
          type='checkbox'
          checked={checked}
          name={children.FollowerId.toString()}
          className='checkbox'
          onChange={checkHandler}
        />
      </label>
    </div>
  );
}
