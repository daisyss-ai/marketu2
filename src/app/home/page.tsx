import { Suspense } from 'react';
import Home from '../../home/Home';

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <Home />
    </Suspense>
  );
}
