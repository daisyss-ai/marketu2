export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export type ProductType = 'digital_material' | 'service' | 'physical_product';

export type Review = {
  id: string;
  reviewer_id: string;
  product_id: string;
  order_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewerProfile = {
  id: string;
  student_id: string | null;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
};

export type ReviewWithUser = Review & {
  reviewer: ReviewerProfile;
};

export type CreateReviewInput = Pick<
  Review,
  'product_id' | 'order_id' | 'rating' | 'comment'
>;

export type UpdateReviewInput = Partial<Pick<Review, 'rating' | 'comment'>>;

export type ReviewStats = {
  average: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type DeliveredOrderOption = {
  id: string;
  product_title: string;
  product_type: ProductType;
};
