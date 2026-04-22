# Feature Specification: MarketU Student Marketplace

**Feature Branch**: `001-student-marketplace`  
**Created**: 2026-04-16  
**Status**: Draft  
**Input**: Build MarketU, a student-to-student marketplace with verified student-only access, dual buyer/seller roles, product catalog with search/filter, shopping cart, checkout, messaging, reviews, seller analytics, and notifications.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Student Registration with ID Verification (Priority: P1)

A new student creates an account by providing an email, password, and valid student ID. The student ID is verified during registration and stored in the user profile. Only verified students can participate in the marketplace as buyers or sellers. Unverified accounts have limited access—they can only view the platform but cannot create, browse, or purchase products.

**Why this priority**: This is the foundation of the entire platform. Without verified student identity, the marketplace loses its core value proposition (student-exclusive access). All other features depend on this.

**Independent Test**: Can be fully tested by creating a new account with valid/invalid student IDs and verifying access restrictions. Delivers platform exclusivity and trust.

**Acceptance Scenarios**:

1. **Given** a student visits the registration page, **When** they complete registration with a valid student ID, **Then** their account is immediately activated and they can access the marketplace as both buyer and seller
2. **Given** a student attempts registration with an invalid student ID, **When** they submit the form, **Then** they see a clear error message and their account creation fails
3. **Given** a student has created an account with a valid student ID, **When** they log in, **Then** their student ID is displayed in their profile and marked as verified
4. **Given** an unverified student (if registration is possible without verification), **When** they attempt to browse or create a listing, **Then** they see a prompt to complete student ID verification before proceeding

---

### User Story 2 - Seller Product Upload (Priority: P2)

A verified seller uploads a product to the marketplace by providing a title, description, price, category, and product images. The product is immediately listed for sale and appears in the browsable catalog. Sellers can upload multiple images per product.

**Why this priority**: Enables supply side of the marketplace. Without seller products, there is nothing for buyers to purchase. This is the second most critical piece after authentication.

**Independent Test**: Can be fully tested by logging in as a seller, uploading a product with all required fields, and verifying it appears in the public catalog. Delivers seller ability to list items.

**Acceptance Scenarios**:

1. **Given** a verified seller is logged in, **When** they navigate to the product upload page and fill in title, description, price, category, and upload at least one image, **Then** the product is created and visible in the marketplace catalog
2. **Given** a seller is uploading a product, **When** they leave a required field empty (title, price, or category), **Then** they see a validation error and cannot submit
3. **Given** a seller has uploaded a product, **When** other buyers browse the marketplace, **Then** they can see this product in the catalog
4. **Given** a seller uploads images, **When** the upload completes, **Then** the images are stored securely and accessible to buyers viewing the product

---

### User Story 3 - Buyer Product Browsing & Search (Priority: P2)

A verified buyer can browse the product catalog, filter by category, and search for products by name. Search results are relevant and fast. The catalog displays product information including title, price, seller name, and primary image. Buyers can click on a product to view full details.

**Why this priority**: Enables demand side of the marketplace. Without the ability to discover products, buyers cannot make purchases. Equal importance to seller upload.

**Independent Test**: Can be fully tested by browsing the catalog, applying category filters, performing searches, and verifying correct product results appear. Delivers buyer product discovery.

**Acceptance Scenarios**:

1. **Given** a verified buyer is logged in, **When** they visit the marketplace homepage, **Then** they see a paginated list of all available products from all sellers
2. **Given** a buyer views the catalog, **When** they select a category filter, **Then** the product list updates to show only products in that category
3. **Given** a buyer wants to find a specific product, **When** they enter a search term (e.g., "laptop"), **Then** they see matching products ranked by relevance
4. **Given** a buyer clicks on a product in the catalog, **When** the product detail page loads, **Then** they see full product information including title, description, price, all images, seller name, and seller rating

---

### User Story 4 - Shopping Cart & Checkout (Priority: P2)

A verified buyer adds products to their shopping cart, reviews cart contents, updates quantities or removes items, and proceeds to checkout. The checkout flow captures shipping/delivery information and processes the transaction. After successful checkout, the buyer receives an order confirmation.

**Why this priority**: Enables transactions—the core business function. Without cart and checkout, even when buyers find products, they cannot purchase them.

**Independent Test**: Can be fully tested by adding products to cart, modifying cart, proceeding to checkout, and completing a transaction. Delivers end-to-end purchase capability.

**Acceptance Scenarios**:

1. **Given** a buyer is viewing a product, **When** they click "Add to Cart", **Then** the product is added to their cart with quantity 1, and they see a confirmation message
2. **Given** a buyer has items in their cart, **When** they click the cart icon, **Then** they see a summary of cart items with prices and a total
3. **Given** a buyer is reviewing their cart, **When** they update a product quantity or remove an item, **Then** the cart total updates immediately
4. **Given** a buyer is ready to checkout, **When** they proceed to the checkout page and enter required information (delivery details), **Then** they see an order review screen with all items and total cost
5. **Given** a buyer confirms their order, **When** they complete payment, **Then** the order is created, the buyer receives an order confirmation, and the seller is notified of the new order

---

### User Story 5 - Buyer-Seller Chat (Priority: P3)

A buyer or seller can initiate a conversation about a specific product listing. Messages are exchanged in real-time within the app. Each product listing has an associated chat thread where buyer and seller can ask questions, negotiate, or discuss delivery before committing to purchase.

**Why this priority**: Enables communication for pre-purchase coordination and post-purchase support. Critical for marketplace trust but secondary to core transaction flow.

**Independent Test**: Can be fully tested by opening a product listing, initiating a chat, sending/receiving messages, and verifying real-time delivery. Delivers buyer-seller communication.

**Acceptance Scenarios**:

1. **Given** a buyer is viewing a product, **When** they click "Chat with Seller" or similar, **Then** a chat window opens or they are taken to a messaging interface for that product
2. **Given** a buyer sends a message, **When** the message is submitted, **Then** the seller receives the message in real-time and can see the buyer's message history
3. **Given** a seller receives a message, **When** they are online, **Then** they receive a notification and can respond immediately
4. **Given** either party has sent messages, **When** they click on the product, **Then** they can see the full chat history for that product

---

### User Story 6 - Reviews & Ratings (Priority: P3)

After a purchase is completed and delivered, a buyer can leave a review and 5-star rating for the product and seller. Reviews are visible to other buyers when browsing the product. Seller ratings are aggregated and displayed on the seller profile.

**Why this priority**: Builds trust and credibility for future transactions. Important for long-term platform health but not required for first transaction.

**Independent Test**: Can be fully tested by completing a purchase, writing a review, and verifying it appears on the product detail page. Delivers feedback and credibility system.

**Acceptance Scenarios**:

1. **Given** a buyer has received their purchase, **When** they visit their order history and click "Leave Review", **Then** they see a form to enter a star rating and written review
2. **Given** a buyer submits a review, **When** the review is processed, **Then** it appears on the product detail page below other reviews
3. **Given** a product has multiple reviews, **When** a buyer views the product, **Then** they see the average rating and can read individual reviews
4. **Given** a seller has received multiple reviews, **When** buyers view the seller's profile, **Then** they see the seller's average rating and review count

---

### User Story 7 - Seller Analytics Dashboard (Priority: P3)

A verified seller can access an analytics dashboard showing insights about their product listings. The dashboard displays metrics such as total views per product, total sales, revenue, and number of reviews. This helps sellers understand performance and optimize their listings.

**Why this priority**: Provides value to sellers for business decisions. Important for seller retention but not required for initial transactions.

**Independent Test**: Can be fully tested by uploading products, generating sales, and viewing analytics dashboard. Delivers seller insights.

**Acceptance Scenarios**:

1. **Given** a seller is logged in, **When** they navigate to their dashboard, **Then** they see an overview of sales, revenue, and product performance
2. **Given** a seller views their analytics, **When** they click on a specific product, **Then** they see detailed metrics for that product (views, sales, revenue, reviews)
3. **Given** a seller has multiple products, **When** they view the dashboard, **Then** they can see a ranked list of best-performing products

---

### User Story 8 - In-App Notifications (Priority: P3)

Users receive real-time notifications within the app for important events: new messages from other users, new orders (for sellers), order status updates, and new reviews. Notifications are displayed as in-app alerts or badges.

**Why this priority**: Improves user engagement and communication flow but not required for core functionality.

**Independent Test**: Can be fully tested by triggering notification events (sending message, placing order, leaving review) and verifying notifications appear. Delivers engagement features.

**Acceptance Scenarios**:

1. **Given** a user receives a new message, **When** the message arrives, **Then** they see an in-app notification badge and a notification alert
2. **Given** a seller receives a new order, **When** a buyer completes checkout, **Then** the seller receives an in-app notification with order details
3. **Given** a buyer receives a review response or a new review on their purchased item, **When** the review is posted, **Then** they see a notification
4. **Given** a user receives a notification, **When** they click on it, **Then** they are taken to the relevant page (chat, order, product, etc.)

---

### Edge Cases

- What happens when a student ID verification fails during registration? (Error message, ability to retry)
- How does system handle when a seller deletes a product that is in buyer carts? (Remove from cart, notify buyer)
- What happens if a buyer and seller have an unresolved chat when the seller marks a product as sold out? (Chat remains accessible for post-purchase communication)
- How does system handle when multiple reviews are submitted for the same product in rapid succession? (All reviews are accepted and displayed)
- What happens if the network connection is lost during checkout? (Transaction state is recoverable; buyer can resume)
- How does system handle when a seller rating drops below a certain threshold? (No action taken in MVP; seller can still list products)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST enforce student ID verification during account registration before granting marketplace access
- **FR-002**: System MUST store and display the verified student ID in the user profile
- **FR-003**: System MUST allow verified users to register as sellers and upload products
- **FR-004**: System MUST validate product uploads (title, description, price, category, at least one image)
- **FR-005**: System MUST store product images securely using Supabase Storage
- **FR-006**: System MUST display all products in a browsable catalog with pagination
- **FR-007**: System MUST support filtering products by category
- **FR-008**: System MUST support searching products by title and description with keyword matching
- **FR-009**: System MUST allow buyers to add products to a shopping cart
- **FR-010**: System MUST allow buyers to modify cart (update quantities, remove items)
- **FR-011**: System MUST calculate accurate totals in the shopping cart
- **FR-012**: System MUST provide a checkout flow that captures delivery information
- **FR-013**: System MUST create an order record when checkout is completed
- **FR-014**: System MUST notify the seller when their product is purchased
- **FR-015**: System MUST enable buyer-seller messaging per product listing
- **FR-016**: System MUST deliver messages in real-time using Supabase Realtime
- **FR-017**: System MUST allow buyers to leave reviews and ratings after purchase delivery
- **FR-018**: System MUST display reviews on product detail pages
- **FR-019**: System MUST calculate and display average seller rating
- **FR-020**: System MUST provide sellers with an analytics dashboard showing sales, revenue, and views
- **FR-021**: System MUST send in-app notifications for messages, orders, and reviews
- **FR-022**: System MUST support buyer and seller roles (users can be both)
- **FR-023**: System MUST enforce Row-Level Security (RLS) on all database tables per MarketU Constitution
- **FR-024**: System MUST use Server Components by default in Next.js per MarketU Constitution
- **FR-025**: System MUST maintain all data in Supabase as the single source of truth per MarketU Constitution

### Key Entities

- **User**: Represents a verified student. Attributes: user_id (UUID), email, password_hash, student_id (verified), first_name, last_name, avatar_url, created_at, updated_at. Relationships: one-to-many with Product (seller), one-to-many with Order (buyer), one-to-many with Review, one-to-many with Message.
  
- **Product**: Represents a seller's listing. Attributes: product_id, seller_id (FK User), title, description, price, category, created_at, updated_at, is_active. Relationships: many-to-one with User (seller), one-to-many with ProductImage, one-to-many with CartItem, one-to-many with Order, one-to-many with Review, one-to-many with Message (chat thread).

- **ProductImage**: Represents images for a product. Attributes: image_id, product_id (FK), image_url, display_order, uploaded_at. Relationships: many-to-one with Product.

- **CartItem**: Represents a product in a buyer's cart. Attributes: cart_item_id, buyer_id (FK User), product_id (FK), quantity, added_at. Relationships: many-to-one with User (buyer), many-to-one with Product.

- **Order**: Represents a completed purchase. Attributes: order_id, buyer_id (FK User), seller_id (FK User), product_id (FK), quantity, total_price, delivery_info (address, etc.), order_status (pending/shipped/delivered), created_at, delivered_at. Relationships: many-to-one with User (buyer), many-to-one with User (seller), many-to-one with Product.

- **Review**: Represents feedback from a buyer. Attributes: review_id, order_id (FK), buyer_id (FK User), seller_id (FK User), product_id (FK), rating (1-5), review_text, created_at. Relationships: many-to-one with Order, many-to-one with User (reviewer), many-to-one with User (seller), many-to-one with Product.

- **Message**: Represents a chat message between buyer and seller. Attributes: message_id, product_id (FK), sender_id (FK User), recipient_id (FK User), message_text, sent_at, is_read. Relationships: many-to-one with Product, many-to-one with User (sender), many-to-one with User (recipient).

- **Notification**: Represents an in-app notification. Attributes: notification_id, user_id (FK), type (message/order/review), related_entity_id, title, body, is_read, created_at. Relationships: many-to-one with User.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Verified students can complete registration and first login in under 3 minutes
- **SC-002**: Students can upload a product with images in under 5 minutes
- **SC-003**: Buyers can find products via search and category filter in under 30 seconds
- **SC-004**: Buyers can add products to cart and complete checkout in under 4 minutes
- **SC-005**: Chat messages are delivered between buyer and seller with latency under 1 second (real-time)
- **SC-006**: System supports at least 500 concurrent buyers browsing the catalog without performance degradation
- **SC-007**: Search results return matching products in under 500ms
- **SC-008**: 95% of student ID verifications complete successfully on first attempt with valid IDs
- **SC-009**: Sellers can view their analytics dashboard with all metrics loading in under 2 seconds
- **SC-010**: Notifications are delivered to users within 2 seconds of triggering event (message sent, order placed, review submitted)
- **SC-011**: All product images display within 1 second of page load
- **SC-012**: At least 80% of users who complete registration successfully make a purchase or upload a product within 7 days
- **SC-013**: Seller retention rate (sellers with at least one sale within 30 days) is at least 60%

## Assumptions

- **Student ID Verification**: Student ID verification is performed during registration using an external verification service or manual validation process (implementation details TBD in planning phase)
- **Two-Role System**: Users can simultaneously be both buyers and sellers on the same account; roles are not mutually exclusive
- **One Account Per Student**: Each verified student ID is tied to exactly one MarketU account; duplicate registrations are prevented
- **Cart Behavior**: Shopping cart is temporary and tied to the current session; items are not persisted if checkout is abandoned after 24 hours
- **Order Completion**: An order is considered "completed" when the buyer marks it as delivered or after 30 days from purchase (auto-completion)
- **Review Eligibility**: Only buyers who have completed an order can leave reviews; sellers cannot leave reviews on their own products
- **Seller Notification**: Sellers are notified immediately when their product is purchased and an order is created
- **Chat History**: Chat messages are permanent and cannot be deleted once sent; both buyer and seller can see full chat history
- **Real-Time Delivery**: Supabase Realtime is used for all real-time features (chat, notifications) per MarketU Constitution
- **RLS Data Isolation**: Users can only access their own cart items, orders, messages, and reviews via RLS policies on the database
- **Server-Side Rendering**: All pages render on the server by default; client components are used only for interactive elements (forms, real-time subscriptions, cart management) per MarketU Constitution
- **Image Storage**: All product and user images are stored in Supabase Storage, not on local file system
- **No Payment Processing**: Initial MVP does not process actual payments; checkout flow captures information but payment is out of scope (can be added in Phase 2)
- **Mobile Responsive**: The platform must work on mobile browsers; a native mobile app is out of scope for v1
