import { Suspense } from 'react';
import Sell from '../../home/Sell';

function SellContent() {
  return <Sell />;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SellContent />
    </Suspense>
  );
}
