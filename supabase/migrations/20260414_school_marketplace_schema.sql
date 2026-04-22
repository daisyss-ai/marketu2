-- School marketplace schema migration
-- Applied in the same step order provided by the request.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- STEP 1 — Custom ENUM Types
CREATE TYPE user_role AS ENUM ('admin', 'student');
CREATE TYPE account_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE product_type AS ENUM ('digital_material', 'service', 'physical_product');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'delivered', 'cancelled');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');

-- STEP 2 — Module 1: Institution
CREATE TABLE institution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  starts_at DATE,
  ends_at DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade INT CHECK (grade IN (10, 11, 12)),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- STEP 3 — Module 2: Users & Auth
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE CASCADE,
  enrollment_code TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  status account_status DEFAULT 'pending',
  is_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE enrollment_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrollment_code TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  status account_status DEFAULT 'pending',
  rejection_note TEXT
);

CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_code TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE students (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  enrollment_year INT,
  is_seller BOOLEAN DEFAULT false,
  rating NUMERIC(3,2) DEFAULT 0.00,
  total_reviews INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- STEP 4 — Module 3: Products, Materials & Services
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  type product_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) DEFAULT 0.00,
  is_free BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  rating NUMERIC(3,2) DEFAULT 0.00,
  total_reviews INT DEFAULT 0,
  total_sales INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE product_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('image', 'pdf', 'doc')),
  filename TEXT,
  size_bytes INT,
  position INT DEFAULT 0,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE digital_material_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  subject TEXT,
  grade_level INT CHECK (grade_level IN (10, 11, 12)),
  topic TEXT,
  file_url TEXT,
  page_count INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE service_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  subject TEXT,
  duration_minutes INT,
  modality TEXT CHECK (modality IN ('presencial', 'online', 'ambos')),
  max_students INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE product_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE content_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_note TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- STEP 5 — Module 4: Cart & Orders
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES students(id),
  status order_status DEFAULT 'pending',
  pickup_location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_title TEXT NOT NULL,
  product_type product_type NOT NULL,
  quantity INT DEFAULT 1,
  unit_price NUMERIC(10,2) DEFAULT 0.00,
  total_price NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id),
  student_id UUID NOT NULL REFERENCES students(id),
  tutor_id UUID NOT NULL REFERENCES students(id),
  scheduled_at TIMESTAMPTZ,
  location TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- STEP 6 — Module 5: Chat
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (buyer_id, seller_id, product_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  status message_status DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- STEP 7 — Module 6: Reviews & Notifications
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (product_id, reviewer_id, order_id)
);

CREATE TABLE seller_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- STEP 8 — Indexes for performance
CREATE INDEX idx_users_institution ON users(institution_id);
CREATE INDEX idx_users_enrollment ON users(enrollment_code);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_login_attempts_code ON login_attempts(enrollment_code, attempted_at);
