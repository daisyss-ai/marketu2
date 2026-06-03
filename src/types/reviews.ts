export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface Review {
  id: string;
  reviewer_id: string;
  product_id: string;
  order_id: string;
  rating: ReviewRating;
  comment: string | null;
  quality_rating: ReviewRating | null;
  communication_rating: ReviewRating | null;
  delivery_rating: ReviewRating | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewerProfile {
  id: string;
  student_id: string | null;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
}

export interface ReviewWithUser extends Review {
  reviewer: ReviewerProfile;
}

export interface ReviewStats {
  average: number;
  total: number;
  distribution: Record<ReviewRating, number>;
}

export interface CreateReviewInput {
  product_id: string;
  order_id: string;
  rating: ReviewRating;
  comment: string | null;
  quality_rating: ReviewRating | null;
  communication_rating: ReviewRating | null;
  delivery_rating: ReviewRating | null;
}

export interface UpdateReviewInput {
  rating?: ReviewRating;
  comment?: string | null;
  quality_rating?: ReviewRating | null;
  communication_rating?: ReviewRating | null;
  delivery_rating?: ReviewRating | null;
}

export interface DeliveredOrderOption {
  id: string;
  product_title: string;
  product_type: 'digital_material' | 'physical_product' | 'service';
}

export type UserReviewRating = 1 | 2 | 3 | 4 | 5;

export interface UserReview {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  order_id: string;
  rating: UserReviewRating;
  comment: string | null;
  badges: string[];
  created_at: string;
  updated_at: string;
}

export interface UserReviewWithProfile extends UserReview {
  reviewer: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface CreateUserReviewInput {
  reviewed_id: string;
  order_id: string;
  rating: UserReviewRating;
  comment: string | null;
  badges: string[];
}