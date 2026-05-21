import Signup from '../../landing/Signup';
import { Suspense } from 'react';

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Suspense fallback={null}>
        <Signup />
      </Suspense>
    </main>
  );
}
