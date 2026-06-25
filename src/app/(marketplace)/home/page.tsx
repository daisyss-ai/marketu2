import { Suspense } from 'react';
import Home from '@/home/Home';

function HomeContent() {
  return <Home />;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
