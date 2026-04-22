import { Suspense } from 'react';
import Home from '../../home/Home';
import RequireAuth from '../../components/RequireAuth';

export default function Page() {
  return (
    <RequireAuth requireVerified={true}>
      <Suspense fallback={<div>Carregando...</div>}>
        <Home />
      </Suspense>
    </RequireAuth>
  );
}
