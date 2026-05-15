import Login from '../../landing/Login';
import { Suspense } from 'react';
export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 ">

      <Suspense fallback={null}>
        <Login />
      </Suspense>
        
    </main>
  );
}
