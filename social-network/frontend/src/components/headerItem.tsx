'use client';
import { generateRandomSixDigitNumber } from '@/clientUtils';
import Link from 'next/link';
import { useState } from 'react';

type ItemProps = {
  href?: string;
  text: string;
  hoverItems?: { href: string; text: string }[];
};
export function Item(props: ItemProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div>
      {props.href ? (
        <Link href={props.href}>{props.text}</Link>
      ) : (
        <div
          className='hover:cursor-pointer'
          onMouseEnter={() => setHovered(true)}
        >
          {props.text}
        </div>
      )}
      {hovered ? (
        <div
          onMouseLeave={() => setHovered(false)}
          className='absolute flex flex-col bg-blue-400 z-[150]'
        >
          {props.hoverItems?.map((item) => (
            <Link key={generateRandomSixDigitNumber()} href={item.href}>
              {item.text}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
