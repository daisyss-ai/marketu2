# API Contract: Real-Time Chat

**Scope**: Buyer-seller messaging per product  
**Base URL**: `/api/messages`  
**Transport**: REST API + Supabase Realtime subscriptions  
**Auth**: Requires authenticated user

---

## `GET /api/messages/:productId`
Fetch chat history for a product.

**Query Parameters**:
- `limit`: Messages to load (default: 50)
- `offset`: Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "product_id": "product-uuid",
    "product_title": "MacBook Pro 14\"",
    "messages": [
      {
        "id": "message-uuid",
        "sender_id": "buyer-uuid",
        "sender_name": "Jane Doe",
        "sender_avatar": "https://storage.url/avatars/uuid.jpg",
        "message_text": "Is this still available?",
        "sent_at": "2026-04-16T10:30:00Z",
        "is_read": true
      },
      {
        "id": "message-uuid-2",
        "sender_id": "seller-uuid",
        "sender_name": "John Smith",
        "sender_avatar": "https://storage.url/avatars/uuid.jpg",
        "message_text": "Yes! Great condition. Can ship today.",
        "sent_at": "2026-04-16T10:35:00Z",
        "is_read": true
      }
    ],
    "other_participant": {
      "id": "seller-uuid",
      "first_name": "John",
      "avatar_url": "https://storage.url/avatars/uuid.jpg"
    }
  }
}
```

---

## `POST /api/messages`
Send a message to seller/buyer about a product.

**Request**:
```json
{
  "product_id": "product-uuid",
  "recipient_id": "seller-uuid",
  "message_text": "Is this still available?"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "message-uuid",
    "product_id": "product-uuid",
    "sender_id": "buyer-uuid",
    "recipient_id": "seller-uuid",
    "message_text": "Is this still available?",
    "sent_at": "2026-04-16T10:30:00Z"
  }
}
```

**Side Effects**:
- Message published to Supabase Realtime channel `chat:product:{product_id}`
- Recipient receives notification (if subscribed)

**Errors**:
- 400: Empty message, invalid product
- 403: Can't message yourself
- 404: Product/recipient not found

---

## `PATCH /api/messages/:messageId/read`
Mark message as read.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "message-uuid",
    "is_read": true
  }
}
```

---

## Real-Time Subscriptions

### Subscribe to Product Chat

**Client-side** (React hook):
```typescript
// Listen for new messages in real-time
const unsubscribe = supabase
  .channel(`chat:product:${productId}`)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
    // New message received
    addMessageToUI(payload.new);
  })
  .subscribe();
```

---

## Implementation Notes

- **Server Component**: Chat interface wrapper is Server Component
- **Client Component**: Message list and input form use `'use client'` with Realtime subscription
- **Message Ordering**: Messages sorted by `sent_at` ascending (oldest first)
- **Real-Time Delivery**: Supabase Realtime publishes on channel `chat:product:{product_id}`
- **Read Status**: Tracked but not enforced (no "typing indicators" in MVP)
- **Rate Limiting**: 10 messages per minute per user (prevent spam)
