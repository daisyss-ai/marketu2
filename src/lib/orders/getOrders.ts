import { createClient } from '@/lib/supabase/server';

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type OrderProductType = 'digital_material' | 'service' | 'physical_product';

interface OrderItemRow {
  id: string;
  product_id: string;
  product_title: string;
  product_type: OrderProductType;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

interface OrderRow {
  id: string;
  status: OrderStatus;
  pickup_location: string | null;
  notes: string | null;
  created_at: string;
  order_items: OrderItemRow[] | null;
}

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  productType: OrderProductType;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  pickupLocation: string | null;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

export async function getOrders(buyerId: string): Promise<Order[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
          id,
          status,
          pickup_location,
          notes,
          created_at,
          order_items(
            id,
            product_id,
            product_title,
            product_type,
            quantity,
            unit_price,
            total_price,
            created_at
          )
        `
      )
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false })
      .order('created_at', { referencedTable: 'order_items', ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as OrderRow[];

    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      pickupLocation: row.pickup_location,
      notes: row.notes,
      createdAt: row.created_at,
      items: (row.order_items ?? []).map((item) => ({
        id: item.id,
        productId: item.product_id,
        productTitle: item.product_title,
        productType: item.product_type,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        createdAt: item.created_at,
      })),
    }));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro inesperado ao carregar pedidos.';
    throw new Error(`Falha ao buscar pedidos: ${message}`);
  }
}
