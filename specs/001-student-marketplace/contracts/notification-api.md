# API Contract: Notifications

**Scope**: In-app notifications for messages, orders, reviews  
**Base URL**: `/api/notifications`  
**Transport**: REST API + Supabase Realtime subscriptions  
**Auth**: Requires authenticated user

---

## `GET /api/notifications`
Fetch user's notifications.

**Query Parameters**:
- `type`: Filter by type (message, order, review) - optional
- `unread_only`: Boolean (default: false)
- `limit`: Notifications to load (default: 50)
- `offset`: Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notification-uuid",
        "type": "message",
        "title": "New message from John Smith",
        "body": "Is this still available?",
        "related_entity_id": "product-uuid",
        "is_read": false,
        "created_at": "2026-04-16T10:30:00Z",
        "action_url": "/products/product-uuid/messages"
      },
      {
        "id": "notification-uuid-2",
        "type": "order",
        "title": "Order shipped",
        "body": "Your order for MacBook Pro 14\" has been shipped",
        "related_entity_id": "order-uuid",
        "is_read": false,
        "created_at": "2026-04-16T11:00:00Z",
        "action_url": "/orders/order-uuid"
      },
      {
        "id": "notification-uuid-3",
        "type": "review",
        "title": "New review received",
        "body": "Jane Doe gave you a 5-star review",
        "related_entity_id": "review-uuid",
        "is_read": true,
        "created_at": "2026-04-15T14:00:00Z",
        "action_url": "/seller/reviews"
      }
    ],
    "unread_count": 2
  }
}
```

---

## `PATCH /api/notifications/:id/read`
Mark notification as read.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "notification-uuid",
    "is_read": true
  }
}
```

---

## `PATCH /api/notifications/read-all`
Mark all notifications as read.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

## `DELETE /api/notifications/:id`
Delete a notification.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

## Real-Time Subscriptions

### Subscribe to Personal Notifications

**Client-side** (React hook):
```typescript
// Listen for new notifications in real-time
const unsubscribe = supabase
  .channel(`notifications:${userId}`)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
    // New notification received
    addNotificationToUI(payload.new);
    playNotificationSound();
  })
  .subscribe();
```

---

## Notification Types

### Message Notification
```json
{
  "type": "message",
  "title": "New message from [Sender Name]",
  "body": "[Message preview - first 50 chars]",
  "related_entity_id": "[product_id]",
  "action_url": "/products/[product_id]/messages"
}
```

**Trigger**: When message inserted into database with recipient = current user

---

### Order Notification
```json
{
  "type": "order",
  "title": "Order [status]",
  "body": "Your order for [product_title] has been [status]",
  "related_entity_id": "[order_id]",
  "action_url": "/orders/[order_id]"
}
```

**Trigger**: When order created or status changed

**Status Examples**: 
- "New order placed" (seller notification)
- "Order shipped" (buyer notification)
- "Order delivered" (buyer notification)

---

### Review Notification
```json
{
  "type": "review",
  "title": "New review received",
  "body": "[Reviewer Name] gave you a [rating]-star review",
  "related_entity_id": "[review_id]",
  "action_url": "/seller/reviews"
}
```

**Trigger**: When review created for seller's product

---

## Implementation Notes

- **Client Component**: Notification bell icon and dropdown use `'use client'` with Realtime subscription
- **Real-Time Delivery**: Supabase Realtime publishes on channel `notifications:{user_id}`
- **Delivery Guarantee**: Notifications created in database before push notification sent
- **Read Status**: Tracks if user has viewed notification (for "unread count" badge)
- **Retention**: Notifications kept for 30 days, then automatically deleted
- **Sound/Vibration**: Optional browser notification API (Notification.requestPermission)
- **Notification Center**: Sidebar/dropdown listing recent notifications with filtering
