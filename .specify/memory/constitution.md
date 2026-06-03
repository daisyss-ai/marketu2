<!-- SYNC_IMPACT_REPORT
Version Change: placeholder → 1.0.0 (initial constitution)
Modified Principles: 8 core principles established for MarketU
Added Sections: Technology Stack, Security & Authentication, Development Workflow
Removed Sections: None
Templates Updated: plan-template.md, spec-template.md, tasks-template.md (no breaking changes)
Follow-up: Review all PRs for constitution compliance per Governance section
-->

# MarketU Constitution

## Core Principles

### I. Student Identity Verification (NON-NEGOTIABLE)
Every user MUST verify their student status at registration using an official student ID. This is non-negotiable for marketplace trust and legal compliance. Requirements:
- Student ID verification mandatory before account activation
- Re-verification required annually
- Unverified accounts cannot list or purchase products
- Verification failure does not delete account; user can resubmit
- Admin dashboard must log all verification attempts and outcomes

### II. Code Quality & TypeScript Strictness (NON-NEGOTIABLE)
All code MUST adhere to strict TypeScript standards to ensure type safety and catch errors at compile-time. This principle is enforced globally:
- `strict: true` and `noImplicitAny: true` in `tsconfig.json` (no exceptions)
- ESLint rules must be passing before any PR merge
- Type declarations required for all external dependencies
- No `any` types allowed without explicit justification in code comments
- All new code must pass type checking without warnings

### III. Supabase as Single Source of Truth
Supabase is the authoritative system for all authentication, authorization, data storage, and real-time state. All other services depend on Supabase as the canonical source:
- All user data originates in Supabase Auth or PostgreSQL
- No authentication state cached outside Supabase without explicit sync mechanism
- No duplicate data sources for critical entities (users, products, transactions)
- Data changes via Supabase API; client-side state must reflect server state
- Migrations and schema changes tracked in version control alongside code

### IV. Row-Level Security (RLS) Mandatory on Every Table
Every table in Supabase PostgreSQL MUST have RLS policies enabled. This is the foundation of multi-tenant data isolation:
- RLS enabled on ALL tables (no exceptions)
- Policies default to DENY; explicitly GRANT only what is needed
- Policies tested in every database migration
- Users can only access rows where RLS policies permit (e.g., their own profile, products they own/purchased)
- Admin users have separate policies for administrative access
- RLS policies documented in migration comments

### V. Server Components by Default with Client Components Only When Necessary
Next.js Server Components are the default architecture. Client components used only when interactivity or browser APIs are truly required:
- All route handlers and API endpoints server-side by default
- Components use `'use client'` only for: form handling, event listeners, browser state (localStorage, window), real-time subscriptions
- Server-only functions and secrets never leak to client components
- Data fetching happens server-side; client components receive pre-fetched data as props
- No unnecessary re-renders from top-level client components
- Layout and page components remain server-rendered unless interaction required

### VI. Image Handling via Supabase Storage
All image uploads and delivery MUST use Supabase Storage. This ensures consistent caching, security, and scalability:
- Images uploaded to `supabase.storage.from('bucket').upload()`
- Image metadata (URL, size, type) stored in PostgreSQL with foreign key to storage
- No external image CDNs or local file uploads (except temp processing)
- Public URLs generated via Supabase Storage signed URLs for secure delivery
- Image transformations (resizing, cropping) handled via Supabase CDN or server-side before upload
- Unused images must be garbage-collected monthly

### VII. Real-Time Features via Supabase Realtime
All real-time features MUST use Supabase Realtime subscriptions. No alternative WebSocket or polling solutions:
- Product listing updates broadcast via Realtime when inventory changes
- Chat messages and notifications delivered via Realtime channels
- User presence (online/offline) tracked via Realtime
- Seller notifications (new inquiries, orders) via Realtime
- Realtime subscriptions cleaned up on component unmount to prevent memory leaks
- Reconnection logic implemented for resilience

### VIII. Consistent UX Across Buyer and Seller Flows
The user interface and experience MUST be consistent for both buyer and seller roles. Inconsistency breaks user mental model:
- Both flows use same card, button, and form component library
- Identical navigation patterns for search, filtering, and sorting
- Color scheme and typography unified across buyer and seller sections
- Error messages, confirmations, and notifications use same tone and format
- Accessibility (WCAG 2.1 AA) applied uniformly to both flows
- A/B testing decisions documented and applied to both flows

## Technology Stack & Architecture

All development uses the following canonical stack:
- **Framework**: Next.js with App Router (Server Components default)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase PostgreSQL with RLS
- **Storage**: Supabase Storage for all images
- **Real-Time**: Supabase Realtime for subscriptions
- **Authentication**: Supabase Auth with student ID verification
- **Styling**: PostCSS and Tailwind CSS (if used) with shared design tokens
- **Testing**: Jest for unit tests, Playwright for E2E tests (planned)
- **Package Management**: npm with lock file in version control

## Security & Data Protection

- All tables implement RLS policies; no exceptions
- Student ID verification required before marketplace access
- Sensitive data (payment info, verification docs) encrypted at rest
- All API routes require authentication via Supabase session
- Environment variables for secrets never committed to repository
- Database migrations reviewed for RLS policy correctness before deployment

## Development Workflow

1. **Type Checking**: `npm run type-check` passes with zero errors before PR submission
2. **Linting**: `npm run lint` passes before PR submission
3. **Code Review**: At least one reviewer must verify TypeScript strictness compliance
4. **RLS Verification**: Any database schema change must include tested RLS policies
5. **Real-Time Testing**: Features using Realtime subscriptions must include subscription lifecycle tests
6. **Component Architecture**: Server/Client component boundary clearly documented in code

## Governance

This constitution supersedes all other development practices and guidelines. Amendments require documentation of rationale, stakeholder review, and a migration plan for existing code.

**Amendment Procedure**:
- Changes must be proposed in writing with rationale
- All team members must review and approve
- Existing code has 30 days to migrate to new principles
- Constitution version increments per semantic versioning

**Compliance Verification**:
- Every PR must include a checklist confirming constitution adherence
- Automated checks (TypeScript, ESLint, RLS policies) run on all commits
- Monthly review of non-automated principles (UX consistency, Supabase as source of truth)

**Version**: 1.0.0 | **Ratified**: 2026-04-16 | **Last Amended**: 2026-04-16
