import { generateRandomSixDigitNumber } from '@/clientUtils';
import { Event } from '@/models/event';
export default function ShowEvent({ event }: { event: Event }) {
  return (
    <div key={generateRandomSixDigitNumber()}>
      <p className='text-md'>{event.description}</p>
      <p className='text-lg'>
        This event will take place in{' '}
        <span className='font-bold'>{formatTimestamp(event.timestamp)}</span>
      </p>
    </div>
  );
}
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000); // Create a date object from the timestamp
  return date.toDateString(); // Convert to local date string
}
