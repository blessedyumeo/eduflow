'use client';

import { useFormStatus } from 'react-dom';

type Props = {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
};

export function SubmitButton({ children, className = 'btn-primary', pendingText }: Props) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? (pendingText ?? 'Подождите…') : children}
    </button>
  );
}
