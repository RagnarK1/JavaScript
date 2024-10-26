//
export default function Collapse({
  title,
  children,
}: {
  title: string;
  children: any;
}) {
  return (
    <div className='collapse bg-base-200'>
      <input type='checkbox' />
      <div className='collapse-title text-xl font-medium'>{title}</div>
      <div className='collapse-content'>{children}</div>
    </div>
  );
}
