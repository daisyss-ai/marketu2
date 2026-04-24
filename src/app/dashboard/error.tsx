'use client';

import React, { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-extrabold text-gray-900">Erro ao carregar o dashboard</h2>
          <p className="text-sm text-gray-600 mt-2">{error?.message || 'Tente novamente.'}</p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#4B187C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3E1367] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
}

