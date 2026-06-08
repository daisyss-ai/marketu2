'use client'

import Link from 'next/link'
import type { SellerReputationData } from '@/lib/profile/types'

interface Props {
  data: SellerReputationData
}

function StarBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-4 text-right tabular-nums text-gray-500 text-xs">{star}</span>
      <span className="text-amber-400 text-xs">★</span>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 tabular-nums text-xs text-gray-400 text-right">{pct}% ({count})</span>
    </div>
  )
}

function CategoryBar({ label, score }: { label: string; score: number }) {
  const pct = (score / 5) * 100
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="tabular-nums font-semibold text-[#4B187C]">
          {score > 0 ? score.toFixed(1) : '—'}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-[#4B187C] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={rating >= s ? 'opacity-100' : 'opacity-25'}>★</span>
      ))}
    </span>
  )
}

export function SellerReputation({ data }: Props) {
  const { avg_rating, total_reviews, distribution, category_scores, recent_reviews } = data

  return (
    <div className="space-y-6">
      {/* Summary + Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="flex flex-col items-center justify-center gap-1 py-2">
          <span className="text-5xl font-bold tabular-nums text-gray-800">
            {total_reviews > 0 ? avg_rating.toFixed(1) : '—'}
          </span>
          <StarDisplay rating={Math.round(avg_rating)} />
          <span className="text-sm text-gray-400 mt-1">
            {total_reviews} {total_reviews === 1 ? 'avaliação' : 'avaliações'}
          </span>
        </div>
        <div className="flex flex-col justify-center gap-2">
          {[5, 4, 3, 2, 1].map((s) => (
            <StarBar
              key={s}
              star={s}
              count={distribution[s as 1 | 2 | 3 | 4 | 5] ?? 0}
              total={total_reviews}
            />
          ))}
        </div>
      </div>

      {/* Category scores */}
      {(category_scores.quality > 0 || category_scores.communication > 0 || category_scores.speed > 0) && (
        <>
          <div className="border-t border-gray-100" />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Por categoria
            </h3>
            <CategoryBar label="Qualidade" score={category_scores.quality} />
            <CategoryBar label="Comunicação" score={category_scores.communication} />
            <CategoryBar label="Rapidez" score={category_scores.speed} />
          </div>
        </>
      )}

      {/* Recent reviews */}
      {recent_reviews.length > 0 && (
        <>
          <div className="border-t border-gray-100" />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Últimas avaliações
            </h3>
            {recent_reviews.map((review) => (
              <div key={review.id} className="p-4 rounded-xl border border-gray-100 bg-[#f8f7ff] space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Link
                    href={`/profile/user/${review.buyer_id}`}
                    className="text-sm font-semibold text-gray-800 hover:text-[#4B187C] hover:underline"
                  >
                    {review.buyer_name}
                  </Link>
                  <div className="flex items-center gap-2">
                    <StarDisplay rating={review.rating} />
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {total_reviews === 0 && (
        <div className="text-center py-8">
          <span className="text-3xl mb-3 block">⭐</span>
          <p className="text-gray-500 text-sm">Ainda sem avaliações como vendedor.</p>
        </div>
      )}
    </div>
  )
}