# API Contract: Products & Catalog

**Scope**: Product upload, browsing, search, filtering, details  
**Base URL**: `/api/products`  
**Auth**: GET endpoints public (active products only); POST/PATCH/DELETE require authentication

---

## `GET /api/products`
List all active products with pagination, filtering, and search.

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `category`: Filter by category (optional)
- `search`: Search keyword in title/description (optional)
- `sort`: Sort by `newest`, `price-asc`, `price-desc`, `popular` (default: newest)

**Request**:
```
GET /api/products?page=1&limit=20&category=Electronics&search=laptop&sort=price-asc
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid-string",
        "title": "MacBook Pro 14\"",
        "price": 1299.99,
        "category": "Electronics",
        "description": "M3 chip, 8GB RAM",
        "primary_image_url": "https://storage.url/products/uuid/image_1.jpg",
        "seller": {
          "id": "seller-uuid",
          "first_name": "John",
          "avatar_url": "https://storage.url/avatars/uuid.jpg"
        },
        "seller_rating": 4.8,
        "created_at": "2026-04-15T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

---

## `GET /api/products/:id`
Fetch detailed product information with all images.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "title": "MacBook Pro 14\"",
    "description": "M3 chip, 8GB RAM, 512GB SSD, Space Gray",
    "price": 1299.99,
    "category": "Electronics",
    "seller": {
      "id": "seller-uuid",
      "first_name": "John",
      "last_name": "Smith",
      "avatar_url": "https://storage.url/avatars/uuid.jpg",
      "bio": "Tech enthusiast"
    },
    "seller_rating": 4.8,
    "seller_reviews_count": 45,
    "images": [
      {
        "id": "image-uuid",
        "url": "https://storage.url/products/uuid/image_1.jpg",
        "display_order": 0
      },
      {
        "id": "image-uuid-2",
        "url": "https://storage.url/products/uuid/image_2.jpg",
        "display_order": 1
      }
    ],
    "reviews": [
      {
        "id": "review-uuid",
        "buyer_name": "Jane",
        "rating": 5,
        "review_text": "Great condition, fast shipping!",
        "created_at": "2026-04-10T10:00:00Z"
      }
    ],
    "created_at": "2026-04-15T14:30:00Z"
  }
}
```

**Errors**:
- 404: Product not found or inactive

---

## `POST /api/products`
Create a new product listing (seller only).

**Request** (multipart/form-data):
```json
{
  "title": "MacBook Pro 14\"",
  "description": "M3 chip, 8GB RAM, 512GB SSD",
  "price": 1299.99,
  "category": "Electronics",
  "images": [<file>, <file>]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "title": "MacBook Pro 14\"",
    "price": 1299.99,
    "category": "Electronics",
    "images": [
      {
        "id": "image-uuid-1",
        "url": "https://storage.url/products/uuid/image_1.jpg",
        "display_order": 0
      }
    ],
    "created_at": "2026-04-16T10:30:00Z"
  }
}
```

**Errors**:
- 400: Missing required fields, invalid price
- 413: Image file too large (max 10MB per image)
- 401: Not authenticated
- 403: Account not verified

---

## `PATCH /api/products/:id`
Update a product listing (seller only).

**Request**:
```json
{
  "title": "MacBook Pro 14\" - Updated",
  "price": 1199.99,
  "category": "Electronics"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "title": "MacBook Pro 14\" - Updated",
    "price": 1199.99
  }
}
```

**Errors**:
- 403: Not product owner
- 404: Product not found
- 401: Not authenticated

---

## `DELETE /api/products/:id`
Delete a product listing (seller only).

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Product deleted"
}
```

**Errors**:
- 403: Not product owner
- 404: Product not found
- 401: Not authenticated

---

## `GET /api/products/seller/me`
Get authenticated seller's own products.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid-string",
        "title": "MacBook Pro 14\"",
        "price": 1299.99,
        "is_active": true,
        "created_at": "2026-04-15T14:30:00Z",
        "views": 45,
        "sales": 2
      }
    ]
  }
}
```

**Errors**:
- 401: Not authenticated

---

## Implementation Notes

- **Image Upload**: Stored in Supabase Storage at `marketU-public/products/{product_id}/{image_id}.jpg`
- **Search**: Uses PostgreSQL full-text search (GIN index on title + description)
- **Category Filter**: Validates against predefined categories from `categories` table
- **Seller Rating**: Aggregated from `reviews` table; cached for performance
- **Product Views**: Optional analytics tracking (not persisted in MVP)
