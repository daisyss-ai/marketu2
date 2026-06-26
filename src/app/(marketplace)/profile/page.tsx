import { Suspense } from 'react';
import Profile from '@/home/Profile';

function ProfileContent() {
  return <Profile />;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
