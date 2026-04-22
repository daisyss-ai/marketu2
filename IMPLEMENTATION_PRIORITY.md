# Implementation Priority Guide: What to Build Next

**Current Status**: UI foundation complete (70%), Backend missing (0%)  
**Critical Path**: Backend infrastructure needed first  
**Estimated to MVP**: 2 weeks of focused work

---

## 🎯 Week 1: Backend Foundation (CRITICAL - Don't Skip)

### Day 1-2: Supabase Integration Setup

**Tasks** (Sequential - each depends on previous):

1. **Create Supabase Clients** (2-3 hours)
   - File: `src/services/supabase/client.ts`
   - Use: `@supabase/ssr` package (already in package.json)
   - What: Browser client with session management
   - Why: Required for all client-side database access

   - File: `src/services/supabase/server.ts`
   - What: Server-side client for API routes
   - Why: Required for all API route database access

   - File: `src/services/supabase/utils.ts`
   - What: Helper functions (error handling, type conversion)
   - Why: Shared utilities for both clients

   **Code Pattern to Follow** (from your existing setup):
   ```typescript
   // Environment variables already set up in .env.local:
   // NEXT_PUBLIC_SUPABASE_URL=https://mloazyfnidtziewujxgj.supabase.co
   // NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
   
   // Use @supabase/ssr package for proper SSR support
   import { createClient } from '@supabase/ssr'
   ```

2. **Create Type Definitions** (1 hour)
   - File: `src/types/database.ts`
   - What: TypeScript interfaces for all database tables
   - Reference: Check [DATABASE_VALIDATION.md](specs/001-student-marketplace/DATABASE_VALIDATION.md) for exact schema
   - Tables needed:
     - `User` (from users table)
     - `Product` (from products table)
     - `Order` (from orders table)
     - `Message` (from messages table)
     - `Review` (from reviews table)
     - `Notification` (from notifications table)
     - `ProductImage` (from product_images table)

   - File: `src/types/api.ts`
   - What: Request/response types for APIs
   - Examples:
     ```typescript
     export interface SignupRequest { email, password, studentId, firstName, lastName }
     export interface SignupResponse { user, session, message }
     export interface ProductRequest { title, description, price, category, images }
     export interface CartItem { productId, quantity }
     ```

3. **Create Auth Service** (2-3 hours)
   - File: `src/services/auth.ts`
   - Functions needed:
     ```typescript
     export const signUp = (email, password, studentId, firstName, lastName) => {...}
     export const login = (email, password) => {...}
     export const logout = () => {...}
     export const getCurrentUser = () => {...}
     export const validateStudentId = (studentId) => {...}
     ```
   - Use: Supabase Auth + calls to database
   - Integration: Update `src/store/authStore.ts` to use this

### Day 3: Authentication API Routes

4. **Create Auth API Routes** (3-4 hours)

   - `src/app/api/auth/signup/route.ts`
     - Endpoint: POST /api/auth/signup
     - Input: { email, password, studentId, firstName, lastName }
     - Process:
       1. Validate input (email format, password strength, studentId format)
       2. Call Supabase Auth to create user
       3. Create user profile in users table
       4. Return: { user, session, token }
     - Error handling: Return 400 for validation, 409 for duplicate email, 500 for server errors

   - `src/app/api/auth/login/route.ts`
     - Endpoint: POST /api/auth/login
     - Input: { email, password }
     - Process:
       1. Validate input
       2. Call Supabase Auth
       3. Return: { user, session, token }

   - `src/app/api/auth/logout/route.ts`
     - Endpoint: POST /api/auth/logout
     - Process: Clear session, return success

   - `src/app/api/auth/me/route.ts`
     - Endpoint: GET /api/auth/me
     - Process: Return current user from session
     - Protected: Require valid session

### Day 4: Product Infrastructure

5. **Create Product Service** (2-3 hours)
   - File: `src/services/products.ts`
   - Functions:
     ```typescript
     export const getProducts = (filters?, pagination?) => {...}
     export const getProductById = (id) => {...}
     export const createProduct = (data, images) => {...}
     export const updateProduct = (id, data) => {...}
     export const deleteProduct = (id) => {...}
     export const getCategories = () => {...}
     ```

6. **Create Product API Routes** (3-4 hours)

   - `src/app/api/products/route.ts`
     - GET: List products (with filters, pagination, search)
     - POST: Create product (requires auth, multipart form data)

   - `src/app/api/products/[id]/route.ts`
     - GET: Product detail
     - PATCH: Update (seller only)
     - DELETE: Delete (seller only, soft delete)

   - Supabase Storage bucket setup:
     - Create bucket: `products` (or `marketU-public`)
     - Upload path: `products/{product_id}/{filename}`
     - Policy: Allow authenticated users to upload to own folder

---

## 🎯 Week 2: Core Features

### Day 5: Cart & Orders

7. **Create Cart Store** (1 hour)
   - File: `src/store/cartStore.ts`
   - Features:
     - Add item, remove item, update quantity
     - Calculate total
     - Persist to localStorage
     - Clear cart

8. **Create Order Service & APIs** (3-4 hours)
   - File: `src/services/orders.ts`
   - File: `src/app/api/orders/route.ts` (POST create, GET list)
   - File: `src/app/api/orders/[id]/route.ts` (GET detail, PATCH status)

### Day 6: Real-Time Features

9. **Create Message Service & APIs** (4-5 hours)
   - File: `src/services/messages.ts`
   - Key functions:
     - `getMessages(productId)` - Fetch chat history
     - `sendMessage(productId, recipientId, text)` - Send message
     - `subscribeToMessages(productId)` - Real-time subscription (Supabase Realtime)
   - Files:
     - `src/app/api/messages/route.ts` (GET, POST)
     - `src/app/api/messages/[id]/read/route.ts` (PATCH)

10. **Create Review Service & APIs** (2-3 hours)
    - File: `src/services/reviews.ts`
    - File: `src/app/api/reviews/route.ts`
    - File: `src/app/api/reviews/product/[id]/route.ts`
    - File: `src/app/api/reviews/seller/[id]/route.ts`

11. **Create Notification Service & APIs** (2-3 hours)
    - File: `src/services/notifications.ts`
    - File: `src/app/api/notifications/route.ts`
    - File: `src/app/api/notifications/[id]/read/route.ts`
    - Triggers:
      - Create notification when message sent
      - Create notification when order placed
      - Create notification when review posted

---

## 🎯 Week 2 Continued: Integration & Polish

### Day 7-8: Hook Components

12. **Create Custom Hooks** (4-5 hours)
    - `src/hooks/useAuth.ts` - Auth state + context
    - `src/hooks/useCart.ts` - Cart operations
    - `src/hooks/useProducts.ts` - Product queries
    - `src/hooks/useMessages.ts` - Chat + real-time
    - `src/hooks/useNotifications.ts` - Notifications + real-time

13. **Create Utilities** (2-3 hours)
    - `src/utils/validation.ts` - Form validators
    - `src/utils/formatting.ts` - Price, date formatting
    - `src/utils/auth-errors.ts` - Error message translation
    - `src/utils/student-id.ts` - Student ID validation

14. **Create Middleware** (1 hour)
    - `src/middleware.ts` - Route protection
    - Redirect unauthenticated to /login
    - Role-based access control

### Day 9-10: Wire Components to Backend

15. **Update Auth Components** (2-3 hours)
    - Update `src/landing/Login.tsx` to call auth API
    - Update `src/landing/Signup.tsx` to call auth API
    - Connect to `useAuthStore`

16. **Update Product Components** (3-4 hours)
    - Update `src/home/Home.tsx` to fetch products from API
    - Update `src/home/ProductPage.tsx` to fetch product detail
    - Update `src/home/Sell.tsx` to upload to Supabase Storage

17. **Add Missing Components** (4-5 hours)
    - Cart page, checkout page
    - Message components (real-time)
    - Review components
    - Notification center

---

## 📋 Checklist by Day

### ✅ Day 1-2: Supabase Setup
- [ ] `src/services/supabase/client.ts` created
- [ ] `src/services/supabase/server.ts` created
- [ ] `src/services/supabase/utils.ts` created
- [ ] `src/types/database.ts` created with all interfaces
- [ ] `src/types/api.ts` created with request/response types
- [ ] Test: Browser client initializes without errors

### ✅ Day 3: Auth APIs
- [ ] `src/services/auth.ts` created
- [ ] `/api/auth/signup` route works
- [ ] `/api/auth/login` route works
- [ ] `/api/auth/logout` route works
- [ ] `/api/auth/me` route works
- [ ] Test: Can signup, login, logout via API

### ✅ Day 4: Products
- [ ] `src/services/products.ts` created
- [ ] `/api/products` route works (GET)
- [ ] `/api/products` route works (POST)
- [ ] `/api/products/[id]` route works
- [ ] Supabase Storage bucket created
- [ ] Test: Can fetch products, upload product with image

### ✅ Day 5: Cart & Orders
- [ ] `src/store/cartStore.ts` created
- [ ] `/api/orders` route works
- [ ] `/api/orders/[id]` route works
- [ ] Test: Can add to cart, create order

### ✅ Day 6: Real-Time
- [ ] `src/services/messages.ts` created
- [ ] `/api/messages` routes work
- [ ] `src/services/notifications.ts` created
- [ ] `/api/notifications` routes work
- [ ] Test: Can send message, receive via Realtime

### ✅ Day 7-8: Hooks & Utilities
- [ ] All custom hooks created
- [ ] All utility functions created
- [ ] `src/middleware.ts` created
- [ ] Test: Hooks work, utilities work

### ✅ Day 9-10: Wire Everything
- [ ] Login form connected to API
- [ ] Signup form connected to API
- [ ] Home page loads products from API
- [ ] Product detail page loads data
- [ ] Sell form uploads images to Supabase
- [ ] Test: Full auth flow works, product operations work

---

## 🚀 Success Criteria

When you're done, you should be able to:

✅ **Sign up** → User created in database  
✅ **Login** → Session established, token stored  
✅ **View products** → Products loaded from database  
✅ **Upload product** → Images stored in Supabase Storage  
✅ **Add to cart** → Cart state persists in Zustand  
✅ **Checkout** → Order created in database  
✅ **Send message** → Message appears in real-time  
✅ **Receive notification** → Notification triggers on order/message  

---

## 📌 Don't Remake

These are good and should be kept:
- ✅ Login UI (`src/landing/Login.tsx`) - Just wire to API
- ✅ Signup UI (`src/landing/Signup.tsx`) - Just wire to API
- ✅ Home page (`src/home/Home.tsx`) - Just wire to API
- ✅ Product detail (`src/home/ProductPage.tsx`) - Just wire to API
- ✅ Sell form (`src/home/Sell.tsx`) - Just wire to Supabase Storage
- ✅ All styling/components - Look great!

## 💡 Pro Tips

1. **Test as you go**: Don't wait until day 10 to test. Test each API route immediately after creating it.

2. **Use Postman/Insomnia**: Test API routes without frontend first:
   ```
   POST http://localhost:3000/api/auth/signup
   Body: { "email": "test@example.com", "password": "...", "studentId": "..." }
   ```

3. **Check Supabase Dashboard**: Verify data is actually being saved to tables

4. **Leverage existing**: Your API service wrapper (`src/services/api.ts`) will be updated to call these new routes

5. **Follow Constitution**: All API routes must:
   - Use TypeScript strict mode ✅ (already in tsconfig)
   - Implement RLS checks ✅ (Supabase does this)
   - Validate input ✅ (add to each route)
   - Use Supabase as source of truth ✅ (use new services)

---

## 🎯 Estimated Timeline

- **Supabase setup**: 4-5 hours (fastest critical path)
- **Auth system**: 6-8 hours (signup/login/logout working)
- **Product system**: 6-7 hours (viewing and uploading products)
- **Cart/Orders**: 5-6 hours (checkout flow)
- **Real-time**: 8-9 hours (chat and notifications)
- **Polish**: 5-6 hours (wire UI, add missing components, error handling)

**Total**: ~40-50 hours = 1-2 weeks if full-time

---

**You're in great shape. The UI foundation is solid. Now just build the backend infrastructure and wire it all together.** 🚀
