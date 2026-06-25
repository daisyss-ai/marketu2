import { Suspense } from 'react';
import Recommendations from '@/home/Recommendations';

function RecommendationsContent() {
  return <Recommendations />;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RecommendationsContent />
    </Suspense>
  );
}
