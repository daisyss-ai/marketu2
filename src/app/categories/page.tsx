import { Suspense } from 'react';
import CategoriesPage from '../../home/CategoriesPage';

function CategoriesContent() {
  return <CategoriesPage />;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CategoriesContent />
    </Suspense>
  );
}
