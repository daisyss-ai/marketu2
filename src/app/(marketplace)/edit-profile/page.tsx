'use client';
import { Suspense } from 'react';
import EditProfile from '@/home/EditProfile';

function EditProfileContent() {
  return <EditProfile />;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditProfileContent />
    </Suspense>
  );
}
