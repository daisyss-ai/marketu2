# Implementation Plan: MarketU Student Marketplace

**Branch**: `001-student-marketplace` | **Date**: 2026-04-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-student-marketplace/spec.md`

## Summary

MarketU is a student-to-student marketplace platform built on Next.js 14 with TypeScript, Tailwind CSS, Supabase (Auth, PostgreSQL, Storage, Realtime), and Zustand for state management. The platform enforces student identity verification at registration, enabling verified students to participate as both buyers and sellers. Key features include product upload with image storage, product catalog with search/filter, shopping cart checkout flow, real-time buyer-seller chat, reviews/ratings, seller analytics dashboard, and in-app notifications. Implementation prioritizes authentication first, then product upload, catalog browsing, cart/checkout, messaging, reviews, and analytics.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18+  
**Primary Dependencies**: Next.js 14 (App Router), Supabase JS Client, Zustand, Tailwind CSS, PostCSS  
**Storage**: Supabase PostgreSQL (with RLS), Supabase Storage (images)  
**Testing**: Jest for unit tests, Playwright for E2E tests (planned for Phase 2)  
**Target Platform**: Web browsers (desktop and mobile-responsive)
**Project Type**: Full-stack web application (Next.js monolith)  
**Performance Goals**: Product search <500ms, chat message delivery <1s latency, concurrent users 500+  
**Constraints**: Real-time chat via Supabase Realtime, student ID verification required, RLS on all tables, no external payment API (simulated checkout)  
**Scale/Scope**: MVP for ~1000 student users, 50-70 pages/components, 8 major features

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

All MarketU Constitution principles are satisfied by this implementation plan:

✅ **I. Student Identity Verification (NON-NEGOTIABLE)** – FR-001 mandates student ID verification at registration; stored in user profile per FR-002  
✅ **II. Code Quality & TypeScript Strictness (NON-NEGOTIABLE)** – All code in TypeScript (5.x) with strict mode enabled  
✅ **III. Supabase as Single Source of Truth** – All authentication via Supabase Auth; data in Supabase PostgreSQL  
✅ **IV. Row-Level Security (RLS) Mandatory** – All database tables will have RLS policies enabled per FR-023  
✅ **V. Server Components by Default** – Next.js App Router with Server Components default; client components only for forms/realtime  
✅ **VI. Image Handling via Supabase Storage** – FR-005 specifies all product images stored in Supabase Storage  
✅ **VII. Real-Time Features via Supabase Realtime** – FR-016 specifies Supabase Realtime for chat; all notifications via Realtime  
✅ **VIII. Consistent UX Across Buyer and Seller Flows** – Single component library, unified navigation and styling

**Gate Status**: ✅ PASS – No violations found

## Project Structure

### Documentation (this feature)

```text
specs/001-student-marketplace/
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 research findings
├── data-model.md        # Phase 1 database design reference
├── DATABASE_VALIDATION.md ✅ Database schema validation (existing tables)
├── quickstart.md        # Developer quickstart
├── contracts/           # Phase 1 API contract definitions
│   ├── auth-api.md
│   ├── product-api.md
│   ├── cart-api.md
│   ├── order-api.md
│   ├── chat-api.md
│   ├── review-api.md
│   └── notification-api.md
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Status Note

✅ **Database Schema (Phase 1 Data Model)**: Your Supabase project already has the required tables implemented. See [DATABASE_VALIDATION.md](DATABASE_VALIDATION.md) to verify your existing schema matches the MarketU design specification.

### Source Code (repository root)

```text
src/
├── app/                     # Next.js App Router
│   ├── (auth)/              # Authentication routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── verify-student-id/
│   ├── (marketplace)/        # Marketplace routes (authenticated)
│   │   ├── products/        # Product catalog
│   │   ├── product/[id]/    # Product detail
│   │   ├── sell/            # Seller product upload
│   │   ├── cart/            # Shopping cart
│   │   ├── checkout/        # Checkout flow
│   │   ├── orders/          # Order history
│   │   ├── messages/        # Chat interface
│   │   ├── reviews/         # Reviews list
│   │   ├── seller/          # Seller dashboard
│   │   │   ├── dashboard/   # Analytics
│   │   │   └── listings/    # Seller's products
│   │   └── profile/         # User profile
│   ├── api/                 # API routes
│   │   ├── auth/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── messages/
│   │   ├── reviews/
│   │   └── notifications/
│   ├── layout.tsx
│   └── page.tsx
├── components/              # Reusable components
│   ├── ui/                  # Base UI components (buttons, cards, forms)
│   ├── auth/                # Authentication components
│   ├── product/             # Product-related components
│   ├── cart/                # Cart components
│   ├── checkout/            # Checkout components
│   ├── chat/                # Chat components
│   ├── review/              # Review components
│   ├── seller/              # Seller dashboard components
│   └── layout/              # Navigation, header, footer
├── types/                   # TypeScript type definitions
│   ├── database.ts          # Database entity types
│   ├── api.ts               # API request/response types
│   └── index.ts             # Re-exports
├── services/                # Business logic and API clients
│   ├── supabase/            # Supabase client wrappers
│   │   ├── client.ts        # Browser client
│   │   ├── server.ts        # Server-side client
│   │   └── utils.ts         # Utilities
│   ├── auth.ts              # Authentication service
│   ├── products.ts          # Product service
│   ├── orders.ts            # Order service
│   ├── cart.ts              # Cart service
│   ├── messages.ts          # Chat service
│   ├── reviews.ts           # Review service
│   └── notifications.ts     # Notification service
├── store/                   # Zustand stores
│   ├── authStore.ts         # Auth state
│   ├── cartStore.ts         # Cart state (Zustand)
│   ├── userStore.ts         # User profile state
│   └── notificationStore.ts # Notification state
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts
│   ├── useCart.ts
│   ├── useProducts.ts
│   ├── useMessages.ts
│   └── useNotifications.ts
├── utils/                   # Utility functions
│   ├── formatting.ts        # Format prices, dates, etc.
│   ├── validation.ts        # Form validation
│   ├── student-id.ts        # Student ID verification helpers
│   └── filters.ts           # Product filtering logic
├── styles/                  # Global styles
│   ├── globals.css
│   └── variables.css        # Tailwind theme variables
└── middleware.ts            # Next.js middleware (auth checks)

tests/
├── unit/                    # Unit tests
│   ├── services/
│   ├── utils/
│   └── store/
├── integration/             # Integration tests
│   ├── auth.test.ts
│   ├── products.test.ts
│   └── orders.test.ts
└── e2e/                     # E2E tests (Playwright)
    ├── auth.spec.ts
    ├── shopping.spec.ts
    └── messaging.spec.ts

public/
├── assets/
│   └── images/              # Static images, logos
```

**Structure Decision**: Single monolithic Next.js application (fullstack) with co-located frontend/backend. This is optimal for a marketplace MVP with tight UI/API coupling and Supabase as the database backbone. The App Router organization groups related routes logically. API routes are minimal wrappers around Supabase services since Supabase handles most business logic via RLS policies.

## Complexity Tracking

No constitution violations identified. All principles are satisfied by the proposed architecture.

