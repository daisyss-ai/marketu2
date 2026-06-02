import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewStats } from '@/components/reviews/ReviewStats';
import { createClient } from '@/lib/supabase/server';
import {
  getReviewStats,
  getReviewsByProduct,
  getUserDeliveredOrders,
} from '@/lib/reviews/review';

type ProductReviewsProps = {
  productId: string;
};

export async function ProductReviews({ productId }: ProductReviewsProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [reviews, stats] = await Promise.all([
    getReviewsByProduct(productId),
    getReviewStats(productId),
  ]);

  let eligibleOrders = [] as Awaited<ReturnType<typeof getUserDeliveredOrders>>;

  if (user) {
    const deliveredOrders = await getUserDeliveredOrders(user.id, productId);
    const reviewedOrderIds = new Set(
      reviews
        .filter((review) => review.reviewer_id === user.id)
        .map((review) => review.order_id)
    );

    eligibleOrders = deliveredOrders.filter((order) => !reviewedOrderIds.has(order.id));
  }

  return (
    <section className="mx-auto mt-12 max-w-6xl px-6 pb-12">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
            Buyer feedback
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">Reviews</h2>
        </div>

        <ReviewStats size="lg" stats={stats} />

        {user && eligibleOrders.length > 0 ? (
          <ReviewForm eligibleOrders={eligibleOrders} productId={productId} />
        ) : user ? (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            Só pode avaliar este produto depois de ter pelo menos um pedido entregue sem review.
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            Inicie sessão com uma conta que já tenha recebido este produto para escrever uma review.
          </section>
        )}

        <ReviewList
          canWriteReview={eligibleOrders.length > 0}
          currentUserId={user?.id ?? null}
          reviews={reviews}
        />
      </div>
    </section>
  );
}
