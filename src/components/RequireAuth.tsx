'use client';
import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'next/navigation';

interface RequireAuthProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

const RequireAuth = ({ children, requireVerified = true }: RequireAuthProps) => {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else if (requireVerified && !user.studentIdVerified) {
      router.replace('/verify-email');
    }
  }, [user, requireVerified, router]);

  // Show nothing while redirecting
  if (!user) {
    return null;
  }

  // Show nothing while checking verification
  if (requireVerified && !user.studentIdVerified) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAuth;
