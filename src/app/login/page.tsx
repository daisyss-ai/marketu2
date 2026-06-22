import Login from '../../landing/Login';
import { Suspense } from 'react';

function LoginContent() {
  return <Login />;
}

export default function Page() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <LoginContent />
      </Suspense>
    </main>
  );
}