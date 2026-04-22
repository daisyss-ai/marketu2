# Research: MarketU Student Marketplace

**Phase**: 0 (Research & Decision Documentation)  
**Input**: Feature specification, technical arguments, technology choices  
**Output**: Consolidated research findings and implementation decisions

## Decision: Technology Stack & Architecture

### Stack Selection ✅

**Decision**: Next.js 14 App Router + TypeScript + Supabase + Zustand + Tailwind CSS

**Rationale**:
- **Next.js 14 App Router** – Enables Server Components by default (Constitution Principle V), which reduces client-side JavaScript and improves security for authentication. App Router provides intuitive file-based routing that matches the marketplace feature structure.
- **TypeScript (strict mode)** – Mandatory per Constitution Principle II. Strict mode enforces type safety across all code, catching errors at compile-time rather than runtime. Critical for marketplace correctness around transactions and data integrity.
- **Supabase** – Complete backend-as-a-service for auth, database, storage, and realtime. Satisfies Constitution Principles III (single source of truth), IV (RLS enforcement), VI (Storage for images), VII (Realtime subscriptions). Eliminates need to build auth from scratch while providing built-in RLS policies.
- **Zustand** – Lightweight state management for client-side cart state. Specified in arguments and recommended for Next.js App Router (simpler than Redux). Cart state doesn't need persistence across sessions (assumption from spec).
- **Tailwind CSS** – Utility-first CSS framework ensures consistent styling across buyer/seller flows (Constitution Principle VIII). Fast development and built-in accessibility utilities.

**Alternatives Considered**:
- React Context instead of Zustand: Rejected because Context causes unnecessary re-renders in App Router; Zustand provides better performance for cart updates.
- External payment provider (Stripe/PayPal): Rejected per spec assumption – "no external payment API (simulated checkout)"
- PostgreSQL + REST API (no Supabase): Rejected because Supabase provides RLS out-of-the-box, reducing security vulnerabilities and eliminating need to implement authorization layer.

### Student ID Verification Approach ✅

**Decision**: Student ID field in user profile table; verification logic implemented as application validation + optional third-party integration point

**Rationale**:
- Specification requires student ID verification but doesn't specify the verification service (FR-001 states "valid student ID" without details).
- MVP approach: Accept student ID during signup, store in Supabase auth metadata + user profile table, validate format (university-specific patterns can be added per institution).
- Future integration point: Can add third-party verification service (university registrar API, Duo, etc.) in Phase 2 without breaking database schema.
- RLS policy: Only user who owns the student ID can see/modify it; admin role can view all verifications for audit purposes.

### Real-Time Chat Implementation ✅

**Decision**: Supabase Realtime with publish/subscribe channels per product listing

**Rationale**:
- FR-016 requires real-time chat delivery (current implementation uses this via Realtime).
- Supabase Realtime provides reliable message delivery with guaranteed ordering and reconnection logic.
- Channel naming: `chat:product:{product_id}` enables buyer-seller communication scoped to product. Messages include sender_id, recipient_id, message_text, sent_at.
- Client-side: Implement hook `useProductChat()` that subscribes/unsubscribes on mount/unmount to prevent memory leaks.
- No polling needed; Realtime subscriptions push updates to all connected clients with <1s latency per success criteria SC-005.

### Image Storage & CDN ✅

**Decision**: Supabase Storage with public/signed URLs and optional CDN configuration

**Rationale**:
- FR-005 mandates Supabase Storage for all images (Constitution Principle VI).
- Product images stored in `marketU-public.products` bucket with public read access (buyers need to view without auth).
- User avatars stored in `marketU-public.avatars` bucket with public read access.
- Seller verification documents stored in `marketU-private.verifications` bucket with authenticated-only access.
- Supabase Storage generates signed URLs (valid for 1 hour) for sensitive image access.
- Optional: Enable Supabase CDN cache layer for high-traffic image delivery (no custom configuration needed in MVP).

### Cart State Management ✅

**Decision**: Zustand store (client-side only) + optional server-side sync on checkout

**Rationale**:
- Specification assumes temporary cart (not persisted; abandoned after 24 hours per assumption).
- Zustand provides lightweight state management for adding/removing/updating quantities in real-time (immediate UI feedback).
- Cart state is not synced to database until checkout is initiated (reduces database writes).
- Optional: Implement server-side cart persistence if users request cart recovery after login.

### Checkout Flow (Simulated) ✅

**Decision**: Collect delivery information, create order record, skip payment processing

**Rationale**:
- Specification assumption: "No payment processing in v1" – checkout is simulated.
- MVP checkout flow: Review cart → Enter delivery address → Confirm order → Create order record in database → Notify seller via Realtime.
- Payment step placeholder: Can be added in Phase 2 by integrating Stripe or PayPal webhook.
- Order status flow: `pending` (created) → `shipped` (seller marks) → `delivered` (buyer marks) → enables review submission.

### Analytics Dashboard ✅

**Decision**: Server-side aggregation queries with cached results

**Rationale**:
- Seller analytics dashboard (User Story 7, P3) requires metrics: total views, sales, revenue, reviews per product.
- Implementation: Create views in Supabase PostgreSQL that aggregate order data, product view tracking via server logs.
- Caching strategy: Cache aggregation results for 1 hour (acceptable for analytics dashboard; real-time not required per spec).
- RLS policy: Each seller can only see their own analytics via auth check in API route.

### Database Design Approach ✅

**Decision**: Normalized schema with RLS policies on every table

**Rationale**:
- Constitution Principle IV: RLS mandatory on every table.
- Schema follows 3rd normal form to avoid data duplication (7 key entities defined in spec: User, Product, ProductImage, CartItem, Order, Review, Message, Notification).
- RLS policies: Default DENY; explicit GRANT for specific operations. Examples:
  - `users` table: User can read their own row; admin can read all
  - `products` table: Anyone can read active products; seller can update their own; admin can delete
  - `orders` table: Buyer/seller can read their own orders; admin can read all
  - `messages` table: Sender/recipient can read conversation; admin can read all
- Foreign keys: Implemented with CASCADE/SET NULL for data integrity.

### Testing Strategy ✅

**Decision**: Jest for unit tests, Playwright for E2E tests (Phase 2)

**Rationale**:
- Unit tests: Test services (auth, products, orders), utils (formatting, validation), Zustand stores for correctness.
- E2E tests (Phase 2): Test complete user journeys (registration → product upload → checkout → review) using Playwright.
- Test coverage target: 80% for services and utilities; E2E covers critical paths.
- CI/CD: GitHub Actions runs tests on every PR; TypeScript type checking and ESLint pass as gates.

## Key Research Findings

### Success Criteria Feasibility Analysis

All 13 success criteria from spec are achievable with proposed tech stack:

- **SC-001 (Registration <3 min)** ✅ – Supabase Auth + form validation completes in seconds
- **SC-002 (Product upload <5 min)** ✅ – Server Component form + Supabase Storage async upload (parallel)
- **SC-003 (Search <30s)** ✅ – PostgreSQL text search or Supabase Vector search can return results in <500ms
- **SC-004 (Checkout <4 min)** ✅ – Lightweight form without payment processing; fast order creation
- **SC-005 (Chat delivery <1s)** ✅ – Supabase Realtime guarantees <1s for connected clients
- **SC-006 (500 concurrent users)** ✅ – Supabase PostgreSQL standard tier supports this; Next.js vertical scaling via deployment
- **SC-007 (Search <500ms)** ✅ – PostgreSQL full-text search indexes; can be optimized with Realtime subscriptions to product changes
- **SC-008 (95% verification success)** ✅ – Format validation + retry mechanism handles this
- **SC-009 (Analytics load <2s)** ✅ – Cached aggregations + server-side rendering
- **SC-010 (Notifications <2s)** ✅ – Realtime subscriptions deliver immediately
- **SC-011 (Images <1s load)** ✅ – Supabase Storage CDN + image optimization
- **SC-012 (80% activation)** ✅ – Requires product/UX optimization; not technical bottleneck
- **SC-013 (60% seller retention)** ✅ – Requires analytics and engagement features; architecture supports this

### Potential Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Student ID verification service unavailable | Medium | Implement local validation; add retry logic with exponential backoff |
| Supabase RLS policy bugs | Low | Thorough testing of policies in migrations; audit logs for data access |
| Chat message loss due to network disconnect | Low | Supabase Realtime includes reconnection logic; client-side queue retry |
| Image upload abuse (large files, many uploads) | Medium | Add file size limits (e.g., 10MB), rate limiting per user, storage quota |
| Cart state loss if user closes tab | Low | Acceptable per assumption; can add localStorage persistence in Phase 2 if needed |
| Seller analytics queries slow on large dataset | Low | Add database indexes on foreign keys; implement pagination; cache results |

## Recommendations for Implementation

1. **Prioritize RLS Policy Testing** – Constitution Principle IV is critical; every migration must include policy tests before deployment.

2. **Implement Product View Tracking** – For analytics (SC-009), add event logging when product is viewed. Use Supabase HTTP API webhooks or separate logging table.

3. **Add Rate Limiting** – Implement rate limiting on image uploads and message sends to prevent abuse.

4. **Database Migration Strategy** – Use Supabase migrations (SQL files in version control) with automated testing. Each migration includes RLS policy definition.

5. **Student ID Validation Library** – Create reusable validation function that can be extended per university (different ID formats per institution).

6. **Server Component Boundary Documentation** – Clearly mark which components use `'use client'` and why (Constitution Principle V enforcement).

## Conclusion

All specification requirements are achievable with the proposed technology stack. No blockers identified. Constitution principles are fully satisfied. Ready to proceed to Phase 1 design (data model, API contracts, quickstart).
