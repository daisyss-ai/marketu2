'use server';

import type { OrderStatus } from '@/lib/orders/getOrders';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type ProductForOrder = {
  id: string;
  seller_id: string;
  title: string;
  price: number | null;
  type: 'digital_material' | 'service' | 'physical_product' | null;
  is_active: boolean | null;
};

type ExistingOrderRow = {
  id: string;
  status: OrderStatus;
};

type OrderItemMatchRow = {
  order_id: string;
};

export async function createOrderAction(
  productId: string
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const normalizedProductId = productId.trim();
    if (!normalizedProductId) {
      return { success: false, error: 'Produto invalido.' };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: authError?.message || 'Precisas de iniciar sessao.' };
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id, title, price, type, is_active')
      .eq('id', normalizedProductId)
      .maybeSingle();

    const typedProduct = product as ProductForOrder | null;

    if (productError || !typedProduct || !typedProduct.type) {
      return { success: false, error: productError?.message || 'Produto nao encontrado.' };
    }

    if (typedProduct.is_active === false) {
      return { success: false, error: 'Este produto ja nao esta disponivel.' };
    }

    if (typedProduct.seller_id === user.id) {
      return { success: false, error: 'Nao podes manifestar interesse no teu proprio produto.' };
    }

    const { data: matchingItems, error: itemsLookupError } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('product_id', normalizedProductId);

    if (itemsLookupError) {
      return { success: false, error: itemsLookupError.message };
    }

    const matchedItems = (matchingItems ?? []) as OrderItemMatchRow[];
    const existingOrderIds = Array.from(
      new Set(matchedItems.map((item) => item.order_id).filter(Boolean))
    );

    if (existingOrderIds.length > 0) {
      const { data: activeOrders, error: activeOrdersError } = await supabase
        .from('orders')
        .select('id, status')
        .eq('buyer_id', user.id)
        .in('id', existingOrderIds)
        .neq('status', 'cancelled');

      if (activeOrdersError) {
        return { success: false, error: activeOrdersError.message };
      }

      if (((activeOrders ?? []) as ExistingOrderRow[]).length > 0) {
        return { success: false, error: 'Ja existe um pedido activo para este produto.' };
      }
    }

    const { data: createdOrder, error: createOrderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        seller_id: typedProduct.seller_id,
        status: 'pending',
      })
      .select('id')
      .single();

    const typedCreatedOrder = createdOrder as { id: string } | null;

    if (createOrderError || !typedCreatedOrder) {
      return { success: false, error: createOrderError?.message || 'Nao foi possivel criar o pedido.' };
    }

    const unitPrice = Number(typedProduct.price ?? 0);
    const quantity = 1;

    const { error: createOrderItemError } = await supabase.from('order_items').insert({
      order_id: typedCreatedOrder.id,
      product_id: typedProduct.id,
      product_title: typedProduct.title,
      product_type: typedProduct.type,
      quantity,
      unit_price: unitPrice,
      total_price: unitPrice * quantity,
    });

    if (createOrderItemError) {
      await supabase.from('orders').delete().eq('id', typedCreatedOrder.id).eq('buyer_id', user.id);
      return { success: false, error: createOrderItemError.message };
    }

    await supabase
      .from('saved_products')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', typedProduct.id);

    revalidatePath('/orders');
    revalidatePath(`/product/${typedProduct.id}`);

    return { success: true, orderId: typedCreatedOrder.id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado ao criar pedido.',
    };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: authError?.message || 'Sessão inválida.' };
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, seller_id, status')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return { success: false, error: orderError?.message || 'Pedido não encontrado.' };
    }

    const currentStatus = order.status as OrderStatus;
    const isBuyer = order.buyer_id === user.id;
    const isSeller = order.seller_id === user.id;

    if (status === 'cancelled') {
      if (currentStatus !== 'pending') {
        return { success: false, error: 'Só é possível cancelar pedidos pendentes.' };
      }

      if (!isBuyer && !isSeller) {
        return { success: false, error: 'Sem permissão para cancelar este pedido.' };
      }
    } else if (status === 'confirmed') {
      if (!isSeller || currentStatus !== 'pending') {
        return { success: false, error: 'Só o vendedor pode confirmar um pedido pendente.' };
      }
    } else if (status === 'delivered') {
      if (!isSeller || currentStatus !== 'confirmed') {
        return { success: false, error: 'Só o vendedor pode marcar um pedido confirmado como entregue.' };
      }
    } else {
      return { success: false, error: 'Transição de estado inválida.' };
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    if (status === 'cancelled') {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id')
        .eq('order_id', orderId);

      if (orderItems && orderItems.length > 0) {
        const productIds = orderItems.map((item: any) => item.product_id);

        await supabase
          .from('saved_products')
          .delete()
          .eq('user_id', order.buyer_id)
          .in('product_id', productIds);
      }
    }

    revalidatePath('/orders');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro inesperado ao actualizar pedido.',
    };
  }
}

export async function checkActiveOrderAction(
  productId: string
): Promise<{ hasActiveOrder: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { hasActiveOrder: false, error: authError?.message || 'Sessão inválida.' };
    }

    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('product_id', productId);

    if (itemsError) {
      return { hasActiveOrder: false, error: itemsError.message };
    }

    if (!orderItems || orderItems.length === 0) {
      return { hasActiveOrder: false };
    }

    const orderIds = orderItems.map((item: { order_id: string }) => item.order_id);

    const { data: activeOrder, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_id', user.id)
      .in('id', orderIds)
      .in('status', ['pending', 'confirmed'])
      .maybeSingle();

    if (orderError) {
      return { hasActiveOrder: false, error: orderError.message };
    }

    return { hasActiveOrder: !!activeOrder };
  } catch (error) {
    return {
      hasActiveOrder: false,
      error: error instanceof Error ? error.message : 'Erro inesperado ao verificar pedidos.',
    };
  }
}
