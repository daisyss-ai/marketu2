# Developer Quickstart: MarketU Student Marketplace

**Last Updated**: 2026-04-16  
**Technology**: Next.js 14, TypeScript, Tailwind CSS, Supabase  
**Audience**: Developers implementing MarketU features

---

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier sufficient for MVP)
- Git for version control

---

## Development Environment Setup

### 1. Clone Repository & Install Dependencies

```bash
git clone <repo-url> marketu
cd marketu
git checkout 001-student-marketplace  # Switch to feature branch

npm install
```

### 2. Configure Supabase

**Create a new Supabase project**:
1. Go to https://app.supabase.com
2. Create a new project (free tier)
3. Note your project URL and anon key

**Create `.env.local` file**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Verify Database Schema

Your Supabase project already has the required tables. **Validate that your schema matches the MarketU design**:

```bash
# See the database validation checklist
cat specs/001-student-marketplace/DATABASE_VALIDATION.md
```

**Quick validation in Supabase SQL Editor**:
```sql
-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

**Expected tables**: `users`, `products`, `product_images`, `categories`, `cart_items`, `orders`, `reviews`, `messages`, `notifications`

See [DATABASE_VALIDATION.md](DATABASE_VALIDATION.md) for detailed checklist of columns, types, and RLS policies.

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000 in your browser.

---

## Project Structure Quick Reference

```
src/
├── app/              # Next.js App Router pages
├── components/       # Reusable React components
├── services/         # API client & business logic
├── store/            # Zustand state management
├── types/            # TypeScript type definitions
└── utils/            # Utility functions

supabase/
├── migrations/       # Database schema (SQL)
└── functions/        # Supabase Edge Functions (optional)
```

### Key Files to Know

- **`src/services/supabase/client.ts`** – Browser-side Supabase client (for client components)
- **`src/services/supabase/server.ts`** – Server-side Supabase client (for API routes)
- **`src/store/cartStore.ts`** – Zustand cart state management
- **`src/middleware.ts`** – Route protection and auth checks
- **`next.config.ts`** – Next.js configuration

---

## Common Development Tasks

### Create a New Page

**Example: Product listing page**

1. **Create route**: `src/app/(marketplace)/products/page.tsx`

```typescript
import { products } from '@/services/products';

export default async function ProductsPage() {
  const products = await products.listActive();
  
  return (
    <div>
      <h1>Products</h1>
      {products.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
```

2. **Server Component**: Page fetches data server-side (no `'use client'`)
3. **Import component**: Add to TypeScript path aliases in `tsconfig.json`

### Create a Client Component (Form)

**Example: Product upload form**

1. **Create component**: `src/components/ProductForm.tsx`

```typescript
'use client'; // Mark as client component for form interactivity

import { useState } from 'react';
import { products } from '@/services/products';

export function ProductForm() {
  const [loading, setLoading] = useState(false);
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const result = await products.create(formData);
      // Handle success
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  }
  
  return <form onSubmit={handleSubmit}>/* Form fields */</form>;
}
```

2. **Use in page**: Import into Server Component page
3. **Form submission**: Calls API route which handles Supabase operations

### Implement Real-Time Chat

**Create hook: `src/hooks/useProductChat.ts`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase/client';
import type { Message } from '@/types';

export function useProductChat(productId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  
  useEffect(() => {
    const channel = supabase
      .channel(`chat:product:${productId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();
    
    return () => channel.unsubscribe();
  }, [productId]);
  
  return messages;
}
```

**Use in component**:

```typescript
'use client';

export function ChatWindow({ productId }: { productId: string }) {
  const messages = useProductChat(productId);
  
  return (
    <div>
      {messages.map(msg => <Message key={msg.id} message={msg} />)}
    </div>
  );
}
```

### Add RLS Policy to New Table

**In migration file** (`supabase/migrations/001_initial.sql`):

```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rows"
  ON your_table
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own rows"
  ON your_table
  FOR UPDATE
  USING (auth.uid() = user_id);
```

### Test API Endpoint

**1. Create API route**: `src/app/api/products/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { products } from '@/services/products';

export async function GET(req: NextRequest) {
  try {
    const data = await products.listActive();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

**2. Test with curl**:

```bash
curl http://localhost:3000/api/products
```

---

## TypeScript Types

**Always define types first** in `src/types/`:

```typescript
// types/database.ts
export interface Product {
  id: string;
  seller_id: string;
  title: string;
  price: number;
  category: string;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  product_id: string;
  status: 'pending' | 'shipped' | 'delivered';
}
```

**Usage**:

```typescript
import type { Product } from '@/types';

async function loadProduct(id: string): Promise<Product> {
  // ...
}
```

---

## State Management with Zustand

**Create store**: `src/store/cartStore.ts`

```typescript
import { create } from 'zustand';

interface CartItem {
  productId: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: CartItem) => void;
  removeItem: (productId: string) => void;
}

export const useCart = create<CartStore>((set) => ({
  items: [],
  addItem: (product) => set((state) => ({
    items: [...state.items, product]
  })),
  removeItem: (productId) => set((state) => ({
    items: state.items.filter(item => item.productId !== productId)
  }))
}));
```

**Use in component**:

```typescript
'use client';

import { useCart } from '@/store/cartStore';

export function CartBadge() {
  const { items } = useCart();
  return <span>Cart ({items.length})</span>;
}
```

---

## Debugging & Troubleshooting

### Enable Debug Logging

Add to `.env.local`:

```
DEBUG=supabase:*
LOG_LEVEL=debug
```

### Check RLS Policies

In Supabase SQL Editor:

```sql
-- View all policies
SELECT * FROM pg_policies;

-- Test policy (as specific user)
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims = json_build_object('sub', 'user-uuid-here');
SELECT * FROM products;  -- Should respect policy
```

### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check Supabase session; verify `.env.local` |
| RLS policy blocks query | Check policy logic; verify user ID matches |
| Images not loading | Check Supabase Storage bucket permissions |
| Real-Time not working | Verify subscription channel name matches table name |
| TypeScript errors | Run `npm run type-check` for full type report |

---

## Code Quality Standards

Per MarketU Constitution:

### Type Checking

```bash
npm run type-check  # Must pass with zero errors
```

### Linting

```bash
npm run lint  # Must pass before PR merge
```

### No `any` Types

❌ Bad:
```typescript
const data: any = await fetch(url).then(r => r.json());
```

✅ Good:
```typescript
interface APIResponse {
  products: Product[];
}
const data: APIResponse = await fetch(url).then(r => r.json());
```

---

## Next Steps

1. **Start with auth**: Implement signup/login endpoints
2. **Build product upload**: Create product form and storage integration
3. **Product listing**: Build catalog with search/filter
4. **Cart & checkout**: Implement shopping flow
5. **Chat**: Add real-time messaging
6. **Reviews**: Add feedback system
7. **Notifications**: Implement alerts
8. **Analytics**: Add seller dashboard

---

## Useful Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run type-check       # Check TypeScript
npm run lint             # Run ESLint
npm test                 # Run tests

supabase db reset        # Reset database (dev only!)
supabase gen types typescript  # Generate TypeScript types from DB
```

---

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Zustand**: https://github.com/pmndrs/zustand
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## Getting Help

- Check Supabase logs: Dashboard → Logs tab
- Review database schema: Dashboard → SQL Editor → Inspect table
- Test endpoints: Use Postman or `curl`
- Debug client: Browser DevTools → Console

Good luck! 🚀
