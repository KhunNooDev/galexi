export function RequiredMark({ required }: { required?: boolean }) {
  if (!required) {
    return null;
  }

  return (
    <span aria-hidden='true' className='text-danger'>
      {' '}
      *
    </span>
  );
}
