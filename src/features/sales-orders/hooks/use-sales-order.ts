import { useQuery } from '@tanstack/react-query';
import { localDb } from '@/services/local-db/client';

export function useSalesOrder(id?: string) {
  return useQuery({
    queryKey: ['sales-orders', id],
    queryFn: async () => {
      if (!id) return null;
      // Get the order
      const order = await localDb.salesOrders.get(id);
      if (!order) return null;

      // Ensure items is an array, parsing if necessary from stored data if it wasn't typed correctly
      // In Dexie, objects might be stored directly, but it's good practice to ensure format.
      const items = Array.isArray(order.items) ? order.items : [];

      return {
        ...order,
        items,
        // Mock payment history for UI detail view
        payments: [
          {
            id: 'pay-1',
            date: order.date,
            amount: order.paidTotal,
            method: 'tunai',
            status: 'success',
          }
        ]
      };
    },
    enabled: !!id,
  });
}
