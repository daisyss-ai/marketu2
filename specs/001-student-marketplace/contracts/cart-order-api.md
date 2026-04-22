# API Contract: Shopping Cart & Checkout

**Scope**: Cart management and order creation  
**Base URL**: `/api/cart` and `/api/orders`  
**Auth**: Requires authenticated user

---

## Cart Management

### `GET /api/cart`
Fetch current user's shopping cart.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cart-item-uuid",
        "product_id": "product-uuid",
        "title": "MacBook Pro 14\"",
        "price": 1299.99,
        "quantity": 1,
        "total": 1299.99,
        "image_url": "https://storage.url/products/uuid/image_1.jpg",
        "seller_name": "John Smith"
      }
    ],
    "subtotal": 1299.99,
    "tax": 129.99,
    "total": 1429.98
  }
}
```

---

### `POST /api/cart/items`
Add product to cart.

**Request**:
```json
{
  "product_id": "product-uuid",
  "quantity": 1
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "cart_item_id": "cart-item-uuid",
    "product_id": "product-uuid",
    "quantity": 1
  },
  "cart_total": 1429.98
}
```

**Errors**:
- 404: Product not found
- 409: Product already in cart (return update endpoint instead)

---

### `PATCH /api/cart/items/:itemId`
Update cart item quantity.

**Request**:
```json
{
  "quantity": 2
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "cart_item_id": "cart-item-uuid",
    "quantity": 2,
    "item_total": 2599.98
  },
  "cart_total": 2729.96
}
```

---

### `DELETE /api/cart/items/:itemId`
Remove item from cart.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Item removed from cart",
  "cart_total": 1429.98
}
```

---

## Checkout & Orders

### `POST /api/orders`
Create order from cart items (checkout).

**Request**:
```json
{
  "delivery_address": "123 Student St",
  "delivery_city": "Boston",
  "delivery_zip": "02115"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order-uuid-1",
        "product_id": "product-uuid",
        "seller_id": "seller-uuid",
        "quantity": 1,
        "total_price": 1299.99,
        "status": "pending",
        "created_at": "2026-04-16T10:30:00Z"
      }
    ],
    "total_orders": 1,
    "total_amount": 1429.98,
    "message": "Order(s) created successfully. Seller(s) have been notified."
  }
}
```

**Side Effects**:
- Cart items cleared after successful checkout
- Seller notified via Realtime notification (Principle VII)
- Buyer receives confirmation notification

**Errors**:
- 400: Missing delivery information
- 401: Not authenticated
- 403: Account not verified

---

### `GET /api/orders`
Fetch user's order history (buyer and seller views).

**Query Parameters**:
- `role`: `buyer` or `seller` (default: buyer)
- `status`: Filter by status (pending, shipped, delivered)
- `page`: Pagination

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "order-uuid",
        "product": {
          "id": "product-uuid",
          "title": "MacBook Pro 14\"",
          "image_url": "https://storage.url/products/uuid/image_1.jpg"
        },
        "quantity": 1,
        "total_price": 1299.99,
        "status": "pending",
        "buyer_name": "Jane Doe",
        "seller_name": "John Smith",
        "delivery_address": "123 Student St, Boston, MA 02115",
        "created_at": "2026-04-16T10:30:00Z",
        "shipped_at": null,
        "delivered_at": null
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

### `GET /api/orders/:id`
Fetch detailed order information.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "buyer": {
      "id": "buyer-uuid",
      "first_name": "Jane",
      "avatar_url": "https://storage.url/avatars/uuid.jpg"
    },
    "seller": {
      "id": "seller-uuid",
      "first_name": "John",
      "avatar_url": "https://storage.url/avatars/uuid.jpg"
    },
    "product": {
      "id": "product-uuid",
      "title": "MacBook Pro 14\"",
      "image_url": "https://storage.url/products/uuid/image_1.jpg"
    },
    "quantity": 1,
    "total_price": 1299.99,
    "status": "pending",
    "delivery_info": {
      "address": "123 Student St",
      "city": "Boston",
      "zip": "02115"
    },
    "created_at": "2026-04-16T10:30:00Z",
    "timeline": [
      {
        "status": "pending",
        "timestamp": "2026-04-16T10:30:00Z"
      }
    ]
  }
}
```

---

### `PATCH /api/orders/:id/status`
Update order status (seller only).

**Request**:
```json
{
  "status": "shipped"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "status": "shipped",
    "shipped_at": "2026-04-16T11:00:00Z"
  }
}
```

**Valid Transitions**:
- pending → shipped
- shipped → delivered

**Side Effects**:
- Buyer notified via Realtime of status change

**Errors**:
- 403: Not seller of this order
- 400: Invalid status transition

---

## Implementation Notes

- **Cart State**: Client-side in Zustand store; no database persistence until checkout
- **Cart Clearing**: Automatic after successful order creation
- **Order Creation**: Creates one order record per unique seller in cart
- **Notifications**: Real-time via Supabase Realtime channels
- **Tax Calculation**: Flat 10% tax (placeholder; can be updated per jurisdiction)
- **Payment**: Simulated (no actual payment processing in MVP)
