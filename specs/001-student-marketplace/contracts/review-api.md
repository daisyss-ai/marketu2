# API Contract: Reviews & Ratings

**Scope**: Review submission and retrieval after purchase  
**Base URL**: `/api/reviews`  
**Auth**: POST requires authenticated user; GET public

---

## `GET /api/reviews/product/:productId`
Fetch all reviews for a product.

**Query Parameters**:
- `sort`: `newest`, `highest-rated`, `lowest-rated` (default: newest)
- `page`: Pagination (default: 1)
- `limit`: Reviews per page (default: 10)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "product_id": "product-uuid",
    "product_title": "MacBook Pro 14\"",
    "average_rating": 4.8,
    "total_reviews": 5,
    "reviews": [
      {
        "id": "review-uuid",
        "buyer_id": "buyer-uuid",
        "buyer_name": "Jane Doe",
        "buyer_avatar": "https://storage.url/avatars/uuid.jpg",
        "rating": 5,
        "review_text": "Excellent condition, fast shipping!",
        "created_at": "2026-04-10T10:00:00Z"
      },
      {
        "id": "review-uuid-2",
        "buyer_id": "buyer-uuid-2",
        "buyer_name": "Mike Johnson",
        "buyer_avatar": "https://storage.url/avatars/uuid-2.jpg",
        "rating": 4,
        "review_text": "Good product, minor scratches on bottom",
        "created_at": "2026-04-05T14:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "total": 5,
      "total_pages": 1
    }
  }
}
```

---

## `GET /api/reviews/seller/:sellerId`
Fetch seller's average rating.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "seller_id": "seller-uuid",
    "seller_name": "John Smith",
    "average_rating": 4.8,
    "total_reviews": 45,
    "rating_breakdown": {
      "5": 40,
      "4": 4,
      "3": 1,
      "2": 0,
      "1": 0
    }
  }
}
```

---

## `POST /api/reviews`
Submit a review for a completed order.

**Request**:
```json
{
  "order_id": "order-uuid",
  "product_id": "product-uuid",
  "seller_id": "seller-uuid",
  "rating": 5,
  "review_text": "Great product, fast shipping!"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "review-uuid",
    "order_id": "order-uuid",
    "product_id": "product-uuid",
    "rating": 5,
    "review_text": "Great product, fast shipping!",
    "created_at": "2026-04-16T10:30:00Z"
  }
}
```

**Validation**:
- Order must exist and belong to authenticated buyer
- Order status must be "delivered"
- Rating must be 1-5
- Review text max 500 characters
- Only one review per order

**Side Effects**:
- Seller receives notification of new review
- Seller rating recalculated (cached)

**Errors**:
- 400: Invalid rating or review text
- 403: Order not owned by buyer or not eligible (not delivered)
- 409: Review already exists for this order
- 404: Order not found

---

## `PATCH /api/reviews/:id`
Edit an existing review (buyer only, same order).

**Request**:
```json
{
  "rating": 4,
  "review_text": "Great product, shipping took longer than expected"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "review-uuid",
    "rating": 4,
    "review_text": "Great product, shipping took longer than expected",
    "updated_at": "2026-04-16T11:00:00Z"
  }
}
```

**Errors**:
- 403: Not review owner
- 404: Review not found

---

## `DELETE /api/reviews/:id`
Delete a review (buyer only).

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Review deleted"
}
```

---

## Implementation Notes

- **Eligibility**: Reviews only creatable after order delivered (24+ hours after purchase)
- **Review Visibility**: All reviews visible publicly (no moderation in MVP)
- **Seller Rating**: Cached in `users` table; recalculated daily
- **Rating Distribution**: Shown as percentage breakdown in seller profile
- **Abuse Prevention**: Rate limit to 10 reviews per day per user
