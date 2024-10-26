'use server';
import { authedFetch } from '@/utils';
import { Event } from '@/models/event';
import { generateRandomSixDigitNumber } from '@/clientUtils';
import ShowEvent from '@/components/showEvent';
import EventMembers from '@/components/eventMembers';
import React from 'react';
import Collapse from '@/components/dropdown';

async function getEvents(groupId: number): Promise<Event[] | undefined> {
  const result = await authedFetch(
    process.env.NEXT_PUBLIC_BACKEND_HOST + '/allEvents?groupId=' + groupId
  );
  if (result.ok) {
    let json = await result.json();
    return json.body;
  }
}
export default async function ShowEvents({
  params,
}: {
  params: { groupId: number };
}) {
  const events = await getEvents(params.groupId);
  return (
    <div className='flex flex-col gap-5'>
      {events && events.length !== 0 ? null : <p>No new events coming.</p>}
      {events?.map((event) => (
        <Collapse title={event.title} key={event.id}>
          <ShowEvent event={event}></ShowEvent>
          <EventMembers
            groupId={params.groupId}
            eventId={event.id}
          ></EventMembers>
        </Collapse>
      ))}
    </div>
  );
}
