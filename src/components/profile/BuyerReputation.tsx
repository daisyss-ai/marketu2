'use client'

import type { BuyerReputationData } from '@/lib/profile/types'

interface Props {
  data: BuyerReputationData
}

export function BuyerReputation({ data }: Props) {
  const { avg_rating, total_reviews, badges } = data
  const positive = badges.filter((b) => b.type === 'positive')
  const negative = badges.filter((b) => b.type === 'negative')

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold tabular-nums text-gray-800">
          {avg_rating.toFixed(1)}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-amber-400 text-lg">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={Math.round(avg_rating) >= s ? 'opacity-100' : 'opacity-25'}>
                ★
              </span>
            ))}
          </span>
          <span className="text-sm text-gray-400">
            {total_reviews} {total_reviews === 1 ? 'avaliação' : 'avaliações'} como comprador
          </span>
        </div>
      </div>

      {badges.length > 0 && (
        <>
          <div className="border-t border-gray-100" />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Badges recebidos
            </h3>
            {positive.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Positivos</p>
                <div className="flex flex-wrap gap-2">
                  {positive.map((b) => (
                    <span
                      key={b.label}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200"
                    >
                      {b.label}
                      <span className="text-xs opacity-60">×{b.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {negative.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Negativos</p>
                <div className="flex flex-wrap gap-2">
                  {negative.map((b) => (
                    <span
                      key={b.label}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200"
                    >
                      {b.label}
                      <span className="text-xs opacity-60">×{b.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}