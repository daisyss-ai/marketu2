# Data Model: MarketU Student Marketplace

**Phase**: 1 (Design)  
**Database**: Supabase PostgreSQL  
**Date**: 2026-04-16  
**Status**: Ready for migration implementation

## Database Tables & Schema

All tables implement Row-Level Security (RLS) policies per MarketU Constitution Principle IV.

### `users`
Represents registered verified students.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  student_id TEXT UNIQUE NOT NULL,
  student_id_verified BOOLEAN DEFAULT FALSE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS Policy: Users can read their own profile; admins can read all
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id OR (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin');
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

**Key Fields**:
- `id`: UUID primary key linked to Supabase Auth user ID
- `email`: Unique email address (synced from Supabase Auth)
- `student_id`: University-issued student ID (unique per platform)
- `student_id_verified`: Boolean flag indicating verification status
- `avatar_url`: Path to user's avatar in Supabase Storage (`avatars` bucket)

**Relationships**:
- One-to-many: User → Products (seller)
- One-to-many: User → Orders (buyer)
- One-to-many: User → Orders (seller via order.seller_id)
- One-to-many: User → Reviews (as reviewer)
- One-to-many: User → Messages (as sender/recipient)

---

### `products`
Represents seller listings.

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = TRUE OR auth.uid() = seller_id);
CREATE POLICY "Sellers can create their own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update their own products" ON products
  FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can delete their own products" ON products
  FOR DELETE USING (auth.uid() = seller_id);
```

**Key Fields**:
- `id`: UUID primary key
- `seller_id`: Foreign key to users table
- `title`: Product name (required)
- `description`: Product details (optional, markdown or plain text)
- `price`: Decimal price (2 decimal places for currency)
- `category`: Predefined category (enum: Electronics, Books, Furniture, Clothing, etc.)
- `is_active`: Soft delete flag (product hidden from catalog but data retained)

**Relationships**:
- Many-to-one: Product → User (seller)
- One-to-many: Product → ProductImage
- One-to-many: Product → CartItem
- One-to-many: Product → Orders

---

### `product_images`
Stores multiple images per product.

```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product images" ON product_images
  FOR SELECT USING (TRUE);
CREATE POLICY "Sellers can manage their product images" ON product_images
  FOR INSERT WITH CHECK (
    EXISTS(SELECT 1 FROM products WHERE id = product_id AND seller_id = auth.uid())
  );
```

**Key Fields**:
- `id`: UUID primary key
- `product_id`: Foreign key to products table
- `image_url`: Path to image in Supabase Storage (`products` bucket)
- `display_order`: Index for image ordering in carousel

**Note**: Images stored in Supabase Storage at `marketU-public/products/{product_id}/{image_id}.jpg`

---

### `categories`
Reference table for product categories.

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL
);

INSERT INTO categories (name, slug) VALUES
  ('Electronics', 'electronics'),
  ('Books', 'books'),
  ('Furniture', 'furniture'),
  ('Clothing', 'clothing'),
  ('Sports', 'sports'),
  ('Other', 'other');

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (TRUE);
```

---

### `cart_items`
Represents items in buyer shopping carts.

```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  added_at TIMESTAMP DEFAULT now(),
  UNIQUE(buyer_id, product_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own cart" ON cart_items
  FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Users can add to their own cart" ON cart_items
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Users can update their own cart" ON cart_items
  FOR UPDATE USING (auth.uid() = buyer_id);
CREATE POLICY "Users can remove from their own cart" ON cart_items
  FOR DELETE USING (auth.uid() = buyer_id);
```

**Note**: Cart is session-based; items not persisted across logout (per spec assumption). Stored in Zustand client-side store.

---

### `orders`
Completed purchases.

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  delivery_zip TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'delivered')),
  created_at TIMESTAMP DEFAULT now(),
  shipped_at TIMESTAMP,
  delivered_at TIMESTAMP
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update order status" ON orders
  FOR UPDATE USING (auth.uid() = seller_id);
```

**Key Fields**:
- `buyer_id`, `seller_id`: Foreign keys to users
- `product_id`: Foreign key to products (reference, not delete constraint – order history preserved if product deleted)
- `status`: Workflow state (pending → shipped → delivered)
- `total_price`: Denormalized from cart for historical accuracy

---

### `reviews`
Buyer feedback after purchase.

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON reviews
  FOR SELECT USING (TRUE);
CREATE POLICY "Buyers can create review for their order" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = buyer_id AND
    EXISTS(SELECT 1 FROM orders WHERE id = order_id AND buyer_id = auth.uid() AND status = 'delivered')
  );
```

**Key Fields**:
- `rating`: 1-5 star rating (required)
- `review_text`: Optional written review (max 500 chars recommended in app)

**Constraint**: Reviews can only be created after order is marked delivered

---

### `messages`
Real-time chat between buyer and seller.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  message_text TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT now(),
  is_read BOOLEAN DEFAULT FALSE
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (auth.uid() IN (sender_id, recipient_id));
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Recipients can mark as read" ON messages
  FOR UPDATE USING (auth.uid() = recipient_id);
```

**Key Fields**:
- `product_id`: Links message to product listing (enables chat grouping)
- `sender_id`, `recipient_id`: Buyer and seller
- `is_read`: Tracks if recipient has viewed message

**Real-Time**: Supabase Realtime publishes messages on channel `chat:product:{product_id}`

---

### `notifications`
In-app alerts for user events.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message', 'order', 'review')),
  related_entity_id UUID,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (TRUE);  -- Restricted via app logic, not RLS
CREATE POLICY "Users can mark notifications as read" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
```

**Real-Time**: Supabase Realtime publishes notifications on channel `notifications:{user_id}`

---

### `user_roles`
Optional role management for admins.

```sql
CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  assigned_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view roles" ON user_roles
  FOR SELECT USING (
    EXISTS(SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
```

---

## Database Indexes

Performance optimizations for common queries:

```sql
-- Products table
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Orders table
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Messages table
CREATE INDEX idx_messages_product_id ON messages(product_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);

-- Notifications table
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Search: Product text search
CREATE INDEX idx_products_search ON products USING gin(
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
);
```

---

## Data Relationships & Constraints

```
users (1) ──→ (many) products
users (1) ──→ (many) orders (as buyer)
users (1) ──→ (many) orders (as seller)
users (1) ──→ (many) reviews
users (1) ──→ (many) messages

products (1) ──→ (many) product_images
products (1) ──→ (many) cart_items
products (1) ──→ (many) orders
products (1) ──→ (many) reviews
products (1) ──→ (many) messages

orders (1) ──→ (many) reviews
categories (1) ──→ (many) products
```

---

## State Transitions

### Product Lifecycle
```
ACTIVE → INACTIVE (seller marks as sold/removed)
         → ACTIVE (seller reactivates)
```

### Order Lifecycle
```
PENDING → SHIPPED (seller marks shipped)
       → DELIVERED (buyer marks received or auto-after 30 days)
       → (enables REVIEW creation)
```

---

## File Storage Structure

All files stored in Supabase Storage (MarketU project):

```
marketU-public/
├── products/
│   ├── {product_id}/
│   │   ├── {image_id}_1.jpg
│   │   ├── {image_id}_2.jpg
│   │   └── ...
│   └── ...
└── avatars/
    ├── {user_id}.jpg
    └── ...

marketU-private/
└── verifications/
    ├── {user_id}_student_id.pdf
    └── ...
```

---

## Migrations

Database migrations stored in version control as `.sql` files with RLS policies and indexes included. Example naming:
- `001_initial_schema.sql` – Create all tables with RLS
- `002_add_indexes.sql` – Add performance indexes
- `003_seed_categories.sql` – Populate categories reference table

Each migration includes comments documenting RLS policies and their purpose.
