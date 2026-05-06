import { Suspense } from 'react';
import DashboardControls from './DashboardControls';
import DashboardResults from './DashboardResults';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <DashboardControls />

      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto px-6 pb-12">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-sm text-gray-700">Carregandoâ€¦</div>
          </div>
        }
      >
        <DashboardResults />
      </Suspense>
    </div>
  );
}

