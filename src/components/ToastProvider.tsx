'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

function ToastFromSearchParams() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const lastShownRef = useRef<string | null>(null);

  useEffect(() => {
    const message = searchParams.get('message');
    const error = searchParams.get('error');

    if (!message && !error) return;

    // Prevent duplicate toasts for the same URL state (React strict effects / rerenders).
    const signature = `${pathname}?${searchParams.toString()}`;
    if (lastShownRef.current === signature) return;
    lastShownRef.current = signature;

    if (message) toast.success(message);
    if (error) toast.error(error);

    // Clean the URL so refresh/back doesn't replay the toast.
    const params = new URLSearchParams(searchParams.toString());
    params.delete('message');
    params.delete('error');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}

export default function ToastProvider() {
  return (
    <>
      <ToastFromSearchParams />
    </>
  );
}

