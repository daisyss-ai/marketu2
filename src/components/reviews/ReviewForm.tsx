'use client';

import { useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { createReviewAction, updateReviewAction } from '@/app/actions/reviews';
import { StarRating } from '@/components/reviews/StarRating';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DeliveredOrderOption, Review } from '@/types/reviews';

interface ReviewFormProps {
  productId: string;
  eligibleOrders: DeliveredOrderOption[];
  initialReview?: Review;
  onCancel?: () => void;
  onSuccess?: () => void;
}

const COMMENT_LIMIT = 1000;

const productTypeLabels: Record<DeliveredOrderOption['product_type'], string> = {
  digital_material: 'Material digital',
  physical_product: 'Produto físico',
  service: 'Serviço',
};

export function ReviewForm({ productId, eligibleOrders, initialReview, onCancel, onSuccess }: ReviewFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState<number>(initialReview?.rating ?? 0);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    initialReview?.order_id ?? eligibleOrders[0]?.id ?? ''
  );
  const [comment, setComment] = useState(initialReview?.comment ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categoryRatings, setCategoryRatings] = useState<{
    quality: number;
    communication: number;
    delivery: number;
  }>({
    quality: initialReview?.quality_rating ?? 0,
    communication: initialReview?.communication_rating ?? 0,
    delivery: initialReview?.delivery_rating ?? 0,
  });

  const isEditing = Boolean(initialReview);
  const trimmedComment = useMemo(() => comment.trim(), [comment]);

  const handleSubmit = () => {
    setError(null);
    setSuccess(null);

    if (rating < 1 || rating > 5) {
      setError('Selecione uma avaliação entre 1 e 5 estrelas.');
      return;
    }

    if (!isEditing && !selectedOrderId) {
      setError('Selecione um pedido entregue antes de enviar a avaliação.');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set('pathname', pathname);
      formData.set('rating', String(rating));
      formData.set('comment', trimmedComment);

      if (categoryRatings.quality > 0) formData.set('quality_rating', String(categoryRatings.quality));
      if (categoryRatings.communication > 0) formData.set('communication_rating', String(categoryRatings.communication));
      if (categoryRatings.delivery > 0) formData.set('delivery_rating', String(categoryRatings.delivery));

      let result;
      if (isEditing && initialReview) {
        formData.set('review_id', initialReview.id);
        result = await updateReviewAction(formData);
      } else {
        formData.set('product_id', productId);
        formData.set('order_id', selectedOrderId);
        result = await createReviewAction(formData);
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(isEditing ? 'Avaliação actualizada com sucesso.' : 'Avaliação enviada! Obrigado pelo seu feedback.');
      router.refresh();
      onSuccess?.();
    });
  };

  return (
    <section
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      id={isEditing ? undefined : 'write-review'}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {isEditing ? 'Editar avaliação' : 'Escrever avaliação'}
          </h3>
          <p className="text-sm text-slate-600">
            Avalie a compra e descreva se o produto correspondeu ao anúncio.
          </p>
        </div>
        {isEditing && onCancel ? (
          <Button onClick={onCancel} size="sm" type="button" variant="ghost">
            Cancelar
          </Button>
        ) : null}
      </div>

      <div className="mt-5 space-y-5">
        {!isEditing && eligibleOrders.length > 1 ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-800">Pedido entregue</span>
            <select
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-xs transition focus:border-slate-900 focus:outline-none"
              disabled={isPending}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              value={selectedOrderId}
            >
              {eligibleOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.product_title} • {productTypeLabels[order.product_type]} • #{order.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-sm font-medium text-slate-800">Avaliação geral</span>
            <div className="flex items-center gap-3">
              <StarRating onChange={setRating} size="lg" value={rating} />
              <span className="text-sm text-slate-600">
                {rating > 0 ? `${rating} / 5` : 'Selecione uma avaliação'}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
            <span className="text-sm font-medium text-slate-700">
              Notas por categoria <span className="text-slate-400 font-normal">(opcional)</span>
            </span>
            {([
              { label: 'Qualidade do produto', key: 'quality' as const },
              { label: 'Comunicação', key: 'communication' as const },
              { label: 'Rapidez na entrega', key: 'delivery' as const },
            ]).map(({ label, key }) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-600 min-w-[140px]">{label}</span>
                <div className="flex items-center gap-2">
                  <StarRating
                    onChange={(v) => setCategoryRatings((prev) => ({ ...prev, [key]: v }))}
                    size="sm"
                    value={categoryRatings[key] ?? 0}
                  />
                  {categoryRatings[key] > 0 ? (
                    <button
                      type="button"
                      onClick={() => setCategoryRatings((prev) => ({ ...prev, [key]: 0 }))}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-800">
            Comentário <span className="text-slate-400 font-normal">(opcional)</span>
          </span>
          <textarea
            className={cn(
              'min-h-28 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-xs transition focus:border-slate-900 focus:outline-none',
              comment.length >= COMMENT_LIMIT && 'border-red-500 focus:border-red-600'
            )}
            disabled={isPending}
            maxLength={COMMENT_LIMIT}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Descreva o estado do produto, a entrega e o que achou da compra..."
            value={comment}
          />
          <div className="flex items-center justify-between text-xs">
            <span className={cn('text-slate-400', comment.length >= COMMENT_LIMIT && 'text-red-600')}>
              {comment.length}/{COMMENT_LIMIT}
            </span>
          </div>
        </label>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {success ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>
        ) : null}

        <Button
          disabled={isPending || (!isEditing && eligibleOrders.length === 0)}
          onClick={handleSubmit}
          type="button"
        >
          {isPending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
          {isEditing ? 'Guardar alterações' : 'Enviar avaliação'}
        </Button>
      </div>
    </section>
  );
}