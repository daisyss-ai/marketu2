import { supabase } from '@/services/supabase/server';
import type { CartItem, Order, OrderItem } from '@/types';

export interface CartServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Cart service for shopping cart operations
 * Handles cart persistence, order creation, and checkout
 */

/**
 * Create order from cart items
 */
export async function createOrder(
  userId: string,
  items: CartItem[],
  totalAmount: number,
  shippingAddress?: string
): Promise<CartServiceResult<Order>> {
  try {
    if (!items.length) {
      return {
        success: false,
        error: 'Cart is empty',
      };
    }

    // Start transaction-like behavior
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: userId,
        total_amount: totalAmount,
        status: 'pending',
        shipping_address: shippingAddress || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      return {
        success: false,
        error: `Failed to create order: ${orderError?.message || 'Unknown error'}`,
      };
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Attempt to rollback by deleting the order
      await supabase.from('orders').delete().eq('id', order.id);

      return {
        success: false,
        error: `Failed to add items to order: ${itemsError.message}`,
      };
    }

    // Update product stocks (decrement available quantity)
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single();

      if (product && product.stock > 0) {
        await supabase
          .from('products')
          .update({ stock: Math.max(0, product.stock - item.quantity) })
          .eq('id', item.product_id);
      }
    }

    return {
      success: true,
      data: order,
    };
  } catch (error) {
    return {
      success: false,
      error: `Cart error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get user's orders
 */
export async function getUserOrders(userId: string): Promise<CartServiceResult<Order[]>> {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: `Failed to fetch orders: ${error.message}`,
      };
    }

    return {
      success: true,
      data: orders || [],
    };
  } catch (error) {
    return {
      success: false,
      error: `Cart error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get order details with items
 */
export async function getOrderDetails(
  orderId: string
): Promise<CartServiceResult<Order & { items: OrderItem[] }>> {
  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return {
        success: false,
        error: `Order not found: ${orderError?.message || 'Unknown error'}`,
      };
    }

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      return {
        success: false,
        error: `Failed to fetch order items: ${itemsError.message}`,
      };
    }

    return {
      success: true,
      data: {
        ...order,
        items: items || [],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: `Cart error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Update order status (admin/seller operation)
 */
export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<CartServiceResult<Order>> {
  try {
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return {
        success: false,
        error: `Invalid status: ${status}`,
      };
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error || !order) {
      return {
        success: false,
        error: `Failed to update order: ${error?.message || 'Unknown error'}`,
      };
    }

    return {
      success: true,
      data: order,
    };
  } catch (error) {
    return {
      success: false,
      error: `Cart error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Cancel order
 */
export async function cancelOrder(orderId: string): Promise<CartServiceResult<Order>> {
  try {
    // Get order to restore stock
    const { data: orderData } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!orderData) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    // Get order items to restore stock
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    // Restore stock for each item
    if (items) {
      for (const item of items) {
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock + item.quantity })
            .eq('id', item.product_id);
        }
      }
    }

    // Update order status
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .select()
      .single();

    if (error || !order) {
      return {
        success: false,
        error: `Failed to cancel order: ${error?.message || 'Unknown error'}`,
      };
    }

    return {
      success: true,
      data: order,
    };
  } catch (error) {
    return {
      success: false,
      error: `Cart error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
