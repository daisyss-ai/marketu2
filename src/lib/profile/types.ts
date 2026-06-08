export interface PublicProfile {
  id: string
  full_name: string
  avatar_url: string | null
  course: string | null
  class: string | null
  created_at: string
  is_verified: boolean
}

export interface SellerStats {
  active_products: number
  completed_sales: number
  positive_rate: number
  confirmation_rate: number
  avg_response_minutes: number | null
}

export interface SellerReputationData {
  avg_rating: number
  total_reviews: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
  category_scores: {
    quality: number
    communication: number
    speed: number
  }
  recent_reviews: {
    id: string
    buyer_id: string
    buyer_name: string
    rating: number
    comment: string | null
    created_at: string
  }[]
}

export interface BuyerReputationData {
  avg_rating: number
  total_reviews: number
  badges: {
    label: string
    type: 'positive' | 'negative'
    count: number
  }[]
}

export type ReputationSeal = 'new' | 'trusted' | 'top_rated' | 'verified'

export function computeSeal(
  totalReviews: number,
  avgRating: number,
  isVerified: boolean
): ReputationSeal {
  if (isVerified) return 'verified'
  if (totalReviews >= 20 && avgRating >= 4.5) return 'top_rated'
  if (totalReviews >= 5 && avgRating >= 4.0) return 'trusted'
  return 'new'
}

export interface Product {
  id: string
  title: string
  price: number
  images: string[] | null
  category_id: string | null
  type: string | null
}