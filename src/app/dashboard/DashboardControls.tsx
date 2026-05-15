'use client';

import { useRouter } from 'next/navigation';

export default function DashboardControls() {
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Gerir os seus produtos</p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/dashboard/new')}
          className="px-4 py-2 rounded-full text-sm font-semibold border border-[#4B187C] text-[#4B187C] bg-white hover:bg-[#4B187C]/5 transition-colors"
        >
          + Novo produto
        </button>
      </div>
    </div>
  );
}

