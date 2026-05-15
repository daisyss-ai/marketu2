'use client';

import { useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';
import { createReviewAction, updateReviewAction } from '@/app/actions/reviews';
import { StarRating } from '@/components/reviews/StarRating';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DeliveredOrderOption, Review } from '@/types/reviews';

type ReviewFormProps = {
  productId: string;
  eligibleOrders: DeliveredOrderOption[];
  initialReview?: Review;
  onCancel?: () => void;
  onSuccess?: () => void;
};

const commentLimit = 1000;

function getProductTypeLabel(value: DeliveredOrderOption['product_type']) {
  switch (value) {
    case 'digital_material':
      return 'Material digital';
    case 'physical_product':
      return 'Produto físico';
    case 'service':
      return 'Serviço';
    default:
      return value;
  }
}

export function ReviewForm({
  productId,
  eligibleOrders,
  initialReview,
  onCancel,
  onSuccess,
}: ReviewFormProps) {
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
      setError('Selecione um pedido entregue antes de enviar a review.');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set('pathname', pathname);
      formData.set('rating', String(rating));
      formData.set('comment', trimmedComment);

      const result =
        isEditing && initialReview
          ? await (() => {
              formData.set('review_id', initialReview.id);
              return updateReviewAction(formData);
            })()
          : await (() => {
              formData.set('product_id', productId);
              formData.set('order_id', selectedOrderId);
              return createReviewAction(formData);
            })();

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(isEditing ? 'Review atualizada com sucesso.' : 'Review enviada com sucesso.');
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
            {isEditing ? 'Editar review' : 'Escrever review'}
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
        {!isEditing ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-800">Pedido entregue</span>
            <select
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-xs transition focus:border-slate-900 focus:outline-none"
              disabled={isPending || eligibleOrders.length === 0}
              onChange={(event) => setSelectedOrderId(event.target.value)}
              value={selectedOrderId}
            >
              {eligibleOrders.length === 0 ? <option value="">Nenhum pedido elegível</option> : null}
              {eligibleOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.product_title} • {getProductTypeLabel(order.product_type)} • #{order.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-800">Avaliação</span>
          <div className="flex items-center gap-3">
            <StarRating onChange={setRating} size="lg" value={rating} />
            <span className="text-sm text-slate-600">
              {rating > 0 ? `${rating} / 5` : 'Selecione uma avaliação'}
            </span>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-800">Comentário</span>
          <textarea
            className={cn(
              'min-h-32 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-xs transition focus:border-slate-900 focus:outline-none',
              comment.length >= commentLimit && 'border-red-500 focus:border-red-600'
            )}
            disabled={isPending}
            maxLength={commentLimit}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Explique o estado do produto, a entrega e o que achou da compra."
            value={comment}
          />
          <div className="flex items-center justify-between text-xs">
            <span className={cn('text-slate-500', comment.length >= commentLimit && 'text-red-600')}>
              {comment.length}/{commentLimit}
            </span>
            <span className="text-slate-400">Opcional, mas útil para outros compradores.</span>
          </div>
        </label>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <div className="flex items-center gap-3">
          <Button
            disabled={isPending || (!isEditing && eligibleOrders.length === 0)}
            onClick={handleSubmit}
            type="button"
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {isEditing ? 'Guardar alterações' : 'Enviar review'}
          </Button>
          {!isEditing && eligibleOrders.length === 0 ? (
            <span className="text-sm text-slate-500">
              Precisa de um pedido entregue para avaliar este produto.
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
