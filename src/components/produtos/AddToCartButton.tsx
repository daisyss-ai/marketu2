'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShoppingCart } from 'lucide-react';
import { saveProductAction, unsaveProductAction } from '@/app/actions/saved';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';

type AuthState = 'loading' | 'guest' | 'ready';

type SavedProductCacheEntry = {
  userId: string;
  productIds: Set<string>;
};

const savedProductsCache = new Map<string, SavedProductCacheEntry>();
const savedProductsPromiseCache = new Map<string, Promise<SavedProductCacheEntry>>();

function invalidateSavedProductsCache(userId: string) {
  savedProductsCache.delete(userId);
  savedProductsPromiseCache.delete(userId);
}

async function getSavedProductsCacheEntry(userId: string): Promise<SavedProductCacheEntry> {
  const cachedEntry = savedProductsCache.get(userId);
  if (cachedEntry) {
    return cachedEntry;
  }

  const pendingEntry = savedProductsPromiseCache.get(userId);
  if (pendingEntry) {
    return pendingEntry;
  }

  const promise = (async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('saved_products')
        .select('product_id')
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }

      const productIds = new Set<string>(
        ((data ?? []) as Array<{ product_id: string }>).map((row) => row.product_id)
      );
      const entry = { userId, productIds };
      savedProductsCache.set(userId, entry);
      return entry;
    } finally {
      savedProductsPromiseCache.delete(userId);
    }
  })();

  savedProductsPromiseCache.set(userId, promise);
  return promise;
}

interface AddToCartButtonProps {
  productId: string;
  sellerId?: string | null;
  className?: string;
}

export default function AddToCartButton({
  productId,
  sellerId = null,
  className,
}: AddToCartButtonProps) {
  const router = useRouter();
  const storeUserId = useAuthStore((state) => state.user?.id ?? null);
  const { increment, decrement } = useCartStore();
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [currentUserId, setCurrentUserId] = useState<string | null>(storeUserId);
  const [isSaved, setIsSaved] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(storeUserId);
  const isHiddenRef = useRef(false);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    isHiddenRef.current = isHidden;
  }, [isHidden]);

  useEffect(() => {
    let isMounted = true;

    const resolveState = async () => {
      try {
        const resolvedUserId = storeUserId
          ? storeUserId
          : (
              await createClient().auth.getUser()
            ).data.user?.id ?? null;

        if (!isMounted) return;

        if (!resolvedUserId) {
          currentUserIdRef.current = null;
          setCurrentUserId(null);
          setIsHidden(false);
          setIsSaved(false);
          setAuthState('guest');
          return;
        }

        if (sellerId && resolvedUserId === sellerId) {
          currentUserIdRef.current = resolvedUserId;
          setCurrentUserId(resolvedUserId);
          setIsHidden(true);
          setIsSaved(false);
          setAuthState('ready');
          return;
        }

        const entry = await getSavedProductsCacheEntry(resolvedUserId);
        if (!isMounted) return;

        currentUserIdRef.current = resolvedUserId;
        setCurrentUserId(resolvedUserId);
        setIsHidden(false);
        setIsSaved(entry.productIds.has(productId));
        setAuthState('ready');
      } catch {
        if (!isMounted) return;

        if (!storeUserId) {
          currentUserIdRef.current = null;
          setCurrentUserId(null);
          setIsHidden(false);
          setIsSaved(false);
          setAuthState('guest');
          return;
        }

        currentUserIdRef.current = storeUserId;
        setCurrentUserId(storeUserId);
        setIsHidden(Boolean(sellerId && storeUserId === sellerId));
        setIsSaved(false);
        setAuthState('ready');
      }
    };

    void resolveState();

    const handleSavedProductsChanged = () => {
      const resolvedUserId = currentUserIdRef.current;
      if (!resolvedUserId || isHiddenRef.current) {
        return;
      }

      invalidateSavedProductsCache(resolvedUserId);
      void (async () => {
        try {
          const entry = await getSavedProductsCacheEntry(resolvedUserId);
          if (!isMounted) return;
          setIsSaved(entry.productIds.has(productId));
        } catch {
          if (!isMounted) return;
          setIsSaved(false);
        }
      })();
    };

    window.addEventListener('saved-products-changed', handleSavedProductsChanged);

    return () => {
      isMounted = false;
      window.removeEventListener('saved-products-changed', handleSavedProductsChanged);
    };
  }, [productId, sellerId, storeUserId]);

  const dispatchSavedProductsChanged = () => {
    window.dispatchEvent(new Event('saved-products-changed'));
  };

  const handleClick = async () => {
    if (authState === 'loading' || isPending || isHidden) {
      return;
    }

    if (authState === 'guest' || !currentUserId) {
      router.push('/login');
      return;
    }

    setIsPending(true);
    setError(null);

    const previousSavedState = isSaved;
    const nextSavedState = !isSaved;

    try {
      // Optimistic UI - atualiza imediatamente
      setIsSaved(nextSavedState);
      if (nextSavedState) {
        increment();
      } else {
        decrement();
      }

      const actionResult = previousSavedState
        ? await unsaveProductAction(productId)
        : await saveProductAction(productId);

      if (!actionResult.success) {
        // Reverte se falhar
        setIsSaved(previousSavedState);
        if (previousSavedState) {
          increment();
        } else {
          decrement();
        }
        setError(actionResult.error || 'Nao foi possivel actualizar o carrinho.');
        return;
      }

      invalidateSavedProductsCache(currentUserId);
      dispatchSavedProductsChanged();
    } finally {
      setIsPending(false);
    }
  };

  if (isHidden) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={authState === 'loading' || isPending}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm transition-all focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed',
        isSaved
          ? 'border-primary bg-primary text-white hover:scale-105'
          : 'border-muted/10 bg-surface/90 text-muted hover:scale-105 hover:text-primary',
        authState === 'loading' ? 'cursor-wait opacity-70' : '',
        className
      )}
      aria-label={isSaved ? 'Remover do carrinho' : 'Adicionar ao carrinho'}
    >
      {authState === 'loading' || isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ShoppingCart className={cn('h-4 w-4', isSaved ? 'fill-current' : 'fill-none')} />
      )}
      {error ? <span className="sr-only">{error}</span> : null}
    </button>
  );
}
