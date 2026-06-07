'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { createUserReviewAction } from '@/app/actions/userReviews';
import { StarRating } from '@/components/reviews/StarRating';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BuyerReviewFormProps {
  orderId: string;
  buyerId: string;
  buyerName: string;
  onSuccess?: () => void;
}

const POSITIVE_BADGES = [
  { id: 'paid_fast', label: '⚡ Pagou rapidamente' },
  { id: 'good_communication', label: '💬 Boa comunicação' },
  { id: 'punctual', label: '⏰ Pontual no levantamento' },
  { id: 'polite', label: '😊 Educado e simpático' },
  { id: 'trustworthy', label: '🤝 Pessoa de confiança' },
];

const NEGATIVE_BADGES = [
  { id: 'slow_response', label: '🐢 Demorou a responder' },
  { id: 'no_show', label: '👻 Não apareceu' },
  { id: 'bad_communication', label: '📵 Difícil de contactar' },
  { id: 'late', label: '⌛ Chegou atrasado' },
];

export function BuyerReviewForm({ orderId, buyerId, buyerName, onSuccess }: BuyerReviewFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState<number>(0);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleBadge = (id: string) => {
    setSelectedBadges((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  if (success) {
    return (
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        ✅ Avaliação enviada. Obrigado pelo feedback!
      </div>
    );
  }

  const handleSubmit = () => {
    setError(null);

    if (rating < 1 || rating > 5) {
      setError('Selecione uma avaliação entre 1 e 5 estrelas.');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set('reviewed_id', buyerId);
      formData.set('order_id', orderId);
      formData.set('rating', String(rating));
      formData.set('badges', JSON.stringify(selectedBadges));
      formData.set('comment', '');
      formData.set('pathname', pathname);

      const result = await createUserReviewAction(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      router.refresh();
      onSuccess?.();
    });
  };

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-900">Avaliar comprador</h4>
        <p className="text-xs text-slate-500">Como foi a experiência com {buyerName}?</p>
      </div>

      <div className="space-y-1">
        <span className="text-xs font-medium text-slate-700">Nota geral</span>
        <div className="flex items-center gap-2">
          <StarRating onChange={setRating} size="md" value={rating} />
          <span className="text-xs text-slate-500">
            {rating > 0 ? `${rating} / 5` : 'Selecione'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium text-slate-700">O que correu bem?</span>
        <div className="flex flex-wrap gap-2">
          {POSITIVE_BADGES.map((badge) => (
            <button
              key={badge.id}
              type="button"
              onClick={() => toggleBadge(badge.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                selectedBadges.includes(badge.id)
                  ? 'border-emerald-400 bg-emerald-100 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
              )}
            >
              {badge.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-medium text-slate-700">O que correu mal?</span>
        <div className="flex flex-wrap gap-2">
          {NEGATIVE_BADGES.map((badge) => (
            <button
              key={badge.id}
              type="button"
              onClick={() => toggleBadge(badge.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                selectedBadges.includes(badge.id)
                  ? 'border-red-400 bg-red-100 text-red-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-red-300'
              )}
            >
              {badge.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      ) : null}

      <Button disabled={isPending} onClick={handleSubmit} size="sm" type="button">
        {isPending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
        Enviar avaliação
      </Button>
    </div>
  );
}