# Database Schema Validation Checklist

**Purpose**: Verify existing Supabase tables match MarketU design specification  
**Date**: 2026-04-16  
**Status**: Validation Guide

---

## Table Validation

Use this checklist to verify your existing Supabase schema. For each table, confirm columns, types, and RLS policies are in place.

### ✅ `users` Table

**Expected Structure**:
```
- id (UUID, PRIMARY KEY)
- email (TEXT, UNIQUE NOT NULL)
- student_id (TEXT, UNIQUE NOT NULL)
- student_id_verified (BOOLEAN, DEFAULT FALSE)
- first_name (TEXT)
- last_name (TEXT)
- avatar_url (TEXT)
- bio (TEXT)
- created_at (TIMESTAMP, DEFAULT now())
- updated_at (TIMESTAMP, DEFAULT now())
```

**RLS Policies Required**:
- [ ] "Users can view own profile" (SELECT using auth.uid() = id OR admin)
- [ ] "Users can update own profile" (UPDATE using auth.uid() = id)

**Validation**:
```sql
SELECT column_name, data_type, is_nullable FROM information_schema.columns
WHERE table_name = 'users' ORDER BY ordinal_position;

SELECT * FROM pg_policies WHERE tablename = 'users';
```

---

### ✅ `products` Table

**Expected Structure**:
```
- id (UUID, PRIMARY KEY)
- seller_id (UUID, NOT NULL, FK users.id ON DELETE CASCADE)
- title (TEXT NOT NULL)
- description (TEXT)
- price (DECIMAL(10,2) NOT NULL)
- category (TEXT NOT NULL)
- is_active (BOOLEAN DEFAULT TRUE)
- created_at (TIMESTAMP DEFAULT now())
- updated_at (TIMESTAMP DEFAULT now())
```

**RLS Policies Required**:
- [ ] "Anyone can view active products" (SELECT using is_active = TRUE OR auth.uid() = seller_id)
- [ ] "Sellers can create their own products" (INSERT with auth.uid() = seller_id)
- [ ] "Sellers can update their own products" (UPDATE using auth.uid() = seller_id)
- [ ] "Sellers can delete their own products" (DELETE using auth.uid() = seller_id)

**Indexes Required**:
- [ ] `idx_products_seller_id` on seller_id
- [ ] `idx_products_category` on category
- [ ] `idx_products_is_active` on is_active
- [ ] `idx_products_created_at` on created_at DESC
- [ ] Full-text search on title + description

---

### ✅ `product_images` Table

**Expected Structure**:
```
- id (UUID, PRIMARY KEY)
- product_id (UUID, NOT NULL, FK products.id ON DELETE CASCADE)
- image_url (TEXT NOT NULL)
- display_order (INT DEFAULT 0)
- uploaded_at (TIMESTAMP DEFAULT now())
```

**RLS Policies Required**:
- [ ] "Anyone can view product images" (SELECT using TRUE)
- [ ] "Sellers can manage their product images" (INSERT with check)

**Validation**:
```sql
SELECT COUNT(*) FROM product_images; -- Should have product images from your uploads
```

---

### ✅ `categories` Table

**Expected Structure**:
```
- id (SERIAL, PRIMARY KEY)
- name (TEXT, UNIQUE NOT NULL)
- description (TEXT)
- slug (TEXT, UNIQUE NOT NULL)
```

**Expected Data**:
```sql
INSERT INTO categories (name, slug) VALUES
  ('Electronics', 'electronics'),
  ('Books', 'books'),
  ('Furniture', 'furniture'),
  ('Clothing', 'clothing'),
  ('Sports', 'sports'),
  ('Other', 'other');
```

**RLS Policies Required**:
- [ ] "Anyone can view categories" (SELECT using TRUE)

---

### ✅ `cart_items` Table

**Expected Structure**:
```
- id (UUID, PRIMARY KEY)
- buyer_id (UUID, NOT NULL, FK users.id ON DELETE CASCADE)
- product_id (UUID, NOT NULL, FK products.id ON DELETE CASCADE)
- quantity (INT DEFAULT 1)
- added_at (TIMESTAMP DEFAULT now())
- UNIQUE(buyer_id, product_id)
```

**RLS Policies Required**:
- [ ] "Users can view their own cart" (SELECT using auth.uid() = buyer_id)
- [ ] "Users can add to their own cart" (INSERT with auth.uid() = buyer_id)
- [ ] "Users can update their own cart" (UPDATE using auth.uid() = buyer_id)
- [ ] "Users can remove from their own cart" (DELETE using auth.uid() = buyer_id)

---

### ✅ `orders` Table

**Expected Structure**:
```
- id (UUID, PRIMARY KEY)
- buyer_id (UUID, NOT NULL, FK users.id)
- seller_id (UUID, NOT NULL, FK users.id)
- product_id (UUID, NOT NULL, FK products.id)
- quantity (INT DEFAULT 1)
- total_price (DECIMAL(10,2) NOT NULL)
- delivery_address (TEXT NOT NULL)
- delivery_city (TEXT NOT NULL)
- delivery_zip (TEXT NOT NULL)
- status (TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'delivered')))
- created_at (TIMESTAMP DEFAULT now())
- shipped_at (TIMESTAMP)
- delivered_at (TIMESTAMP)
```

**RLS Policies Required**:
- [ ] "Users can view their own orders" (SELECT using auth.uid() = buyer_id OR auth.uid() = seller_id)
- [ ] "Buyers can create orders" (INSERT with auth.uid() = buyer_id)
- [ ] "Sellers can update order status" (UPDATE using auth.uid() = seller_id)

**Indexes Required**:
- [ ] `idx_orders_buyer_id` on buyer_id
- [ ] `idx_orders_seller_id` on seller_id
- [ ] `idx_orders_product_id` on product_id
- [ ] `idx_orders_status` on status

---

### ✅ `reviews` Table

**Expected Structure**:
```
- id (UUID, PRIMARY KEY)
- order_id (UUID, NOT NULL, FK orders.id)
- buyer_id (UUID, NOT NULL, FK users.id)
- seller_id (UUID, NOT NULL, FK users.id)
- product_id (UUID, NOT NULL, FK products.id)
- rating (INT NOT NULL CHECK (rating >= 1 AND rating <= 5))
- review_text (TEXT)
- created_at (TIMESTAMP DEFAULT now())
```

**RLS Policies Required**:
- [ ] "Anyone can view reviews" (SELECT using TRUE)
- [ ] "Buyers can create review for their order" (INSERT with check)

---

### ✅ `messages` Table

**Expected Structure**:
```
- id (UUID, PRIMARY KEY)
- product_id (UUID, NOT NULL, FK products.id ON DELETE CASCADE)
- sender_id (UUID, NOT NULL, FK users.id)
- recipient_id (UUID, NOT NULL, FK users.id)
- message_text (TEXT NOT NULL)
- sent_at (TIMESTAMP DEFAULT now())
- is_read (BOOLEAN DEFAULT FALSE)
```

**RLS Policies Required**:
- [ ] "Users can view their messages" (SELECT using auth.uid() IN (sender_id, recipient_id))
- [ ] "Users can send messages" (INSERT with auth.uid() = sender_id)
- [ ] "Recipients can mark as read" (UPDATE using auth.uid() = recipient_id)

**Indexes Required**:
- [ ] `idx_messages_product_id` on product_id
- [ ] `idx_messages_sender_id` on sender_id
- [ ] `idx_messages_recipient_id` on recipient_id
- [ ] `idx_messages_sent_at` on sent_at DESC

---

### ✅ `notifications` Table

**Expected Structure**:
```
- id (UUID, PRIMARY KEY)
- user_id (UUID, NOT NULL, FK users.id ON DELETE CASCADE)
- type (TEXT NOT NULL CHECK (type IN ('message', 'order', 'review')))
- related_entity_id (UUID)
- title (TEXT NOT NULL)
- body (TEXT)
- is_read (BOOLEAN DEFAULT FALSE)
- created_at (TIMESTAMP DEFAULT now())
```

**RLS Policies Required**:
- [ ] "Users can view their own notifications" (SELECT using auth.uid() = user_id)
- [ ] "System can create notifications" (INSERT with TRUE)
- [ ] "Users can mark notifications as read" (UPDATE using auth.uid() = user_id)

**Indexes Required**:
- [ ] `idx_notifications_user_id` on user_id
- [ ] `idx_notifications_created_at` on created_at DESC

---

### Optional: `user_roles` Table

**Expected Structure**:
```
- user_id (UUID, NOT NULL, FK users.id ON DELETE CASCADE, PRIMARY KEY)
- role (TEXT NOT NULL CHECK (role IN ('user', 'admin')))
- assigned_at (TIMESTAMP DEFAULT now())
```

**RLS Policies Required**:
- [ ] "Only admins can view roles" (SELECT using admin check)

---

## Validation Script

Run this to check all RLS policies are enabled:

```sql
-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Check indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

---

## Quick Checklist

- [ ] All 8 tables exist in Supabase
- [ ] RLS enabled on all tables
- [ ] Foreign keys with CASCADE rules in place
- [ ] All required indexes created
- [ ] Categories reference table populated
- [ ] Full-text search index on products (title + description)
- [ ] CHECK constraints for status and rating
- [ ] UNIQUE constraints on email, student_id, product_images (buyer_id, product_id)

---

## If Tables Are Missing

If any required tables are missing from your Supabase project, you can create them using the migration SQL from [data-model.md](data-model.md#database-tables--schema).

**Steps**:
1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy the table creation SQL for missing tables
4. Execute the query
5. Add RLS policies using the policy definitions above

---

## What's Next

Once all tables are validated:
1. ✅ Phase 1 Design (Data Model) is complete
2. → Continue with task generation: `/speckit.tasks`
3. → Implement API endpoints against existing schema
4. → Build frontend components

No database migration needed - your existing schema is the foundation!
