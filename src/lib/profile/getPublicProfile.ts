import { createClient } from '@/lib/supabase/server'
import type {
  PublicProfile,
  SellerStats,
  SellerReputationData,
  BuyerReputationData,
} from './types'

export type {
  PublicProfile,
  SellerStats,
  SellerReputationData,
  BuyerReputationData,
} from './types'

export { computeSeal } from './types'

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, course, class, created_at, is_verified')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return data as PublicProfile
}

export async function getSellerStats(userId: string): Promise<SellerStats> {
  const supabase = await createClient()

  const [productsRes, ordersRes] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', userId)
      .eq('is_active', true),
    supabase
      .from('orders')
      .select('id, status, created_at, updated_at')
      .eq('seller_id', userId),
  ])

  const orders = ordersRes.data ?? []
  const completed = orders.filter((o) => o.status === 'delivered')
  const confirmed = orders.filter((o) => ['confirmed', 'delivered'].includes(o.status))
  const positiveRate =
    orders.length > 0 ? Math.round((confirmed.length / orders.length) * 100) : 0
  const confirmationRate =
    orders.length > 0 ? Math.round((confirmed.length / orders.length) * 100) : 0

  const responseTimes = orders
    .filter((o) => o.status === 'confirmed' || o.status === 'delivered')
    .map((o) => {
      const created = new Date(o.created_at).getTime()
      const updated = new Date(o.updated_at).getTime()
      return (updated - created) / 60000
    })
    .filter((t) => t > 0 && t < 10080)

  const avgResponse =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : null

  return {
    active_products: productsRes.count ?? 0,
    completed_sales: completed.length,
    positive_rate: positiveRate,
    confirmation_rate: confirmationRate,
    avg_response_minutes: avgResponse,
  }
}

export async function getSellerReputation(userId: string): Promise<SellerReputationData> {
  const supabase = await createClient()

  // reviews doesn't have seller_id — join via products
  const { data: reviews } = await supabase
    .from('reviews')
    .select(
      `id, rating, comment, created_at,
       quality_rating, communication_rating, delivery_rating,
       reviewer_id,
       products!reviews_product_id_fkey(seller_id),
       profiles!reviews_reviewer_id_fkey(full_name)`
    )
    .order('created_at', { ascending: false })

  // filter by seller_id from the joined products
  const list = (reviews ?? []).filter(
    (r: any) => r.products?.seller_id === userId
  )

  const total = list.length
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>
  let sumRating = 0, sumQ = 0, sumC = 0, sumS = 0, countCat = 0

  for (const r of list) {
    const star = Math.round(r.rating) as 1 | 2 | 3 | 4 | 5
    dist[star] = (dist[star] ?? 0) + 1
    sumRating += r.rating
    if (r.quality_rating && r.communication_rating && r.delivery_rating) {
      sumQ += r.quality_rating
      sumC += r.communication_rating
      sumS += r.delivery_rating
      countCat++
    }
  }

  return {
    avg_rating: total > 0 ? +(sumRating / total).toFixed(1) : 0,
    total_reviews: total,
    distribution: dist,
    category_scores: {
      quality: countCat > 0 ? +(sumQ / countCat).toFixed(1) : 0,
      communication: countCat > 0 ? +(sumC / countCat).toFixed(1) : 0,
      speed: countCat > 0 ? +(sumS / countCat).toFixed(1) : 0,
    },
    recent_reviews: list.slice(0, 5).map((r: any) => ({
      id: r.id,
      buyer_id: r.reviewer_id,
      buyer_name: (r.profiles as any)?.full_name ?? 'Utilizador',
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
    })),
  }
}

export async function getBuyerReputation(userId: string): Promise<BuyerReputationData> {
  const supabase = await createClient()
  const { data: reviews } = await supabase
    .from('user_reviews')
    .select('id, rating, badges')
    .eq('reviewed_id', userId)

  const list = reviews ?? []
  const total = list.length
  const sumRating = list.reduce((s: number, r: any) => s + r.rating, 0)

  const badgeMap: Record<string, { label: string; type: 'positive' | 'negative'; count: number }> = {}
  for (const r of list) {
    const badges: string[] = r.badges ?? []
    for (const badge of badges) {
      if (!badgeMap[badge]) {
        badgeMap[badge] = {
          label: badge,
          type: r.rating >= 3 ? 'positive' : 'negative',
          count: 0,
        }
      }
      badgeMap[badge].count++
    }
  }

  return {
    avg_rating: total > 0 ? +(sumRating / total).toFixed(1) : 0,
    total_reviews: total,
    badges: Object.values(badgeMap).sort((a, b) => b.count - a.count).slice(0, 8),
  }
}

export async function getSellerProducts(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, title, price, images, category_id, type')
    .eq('seller_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(12)
  return data ?? []
}