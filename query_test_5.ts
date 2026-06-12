import { db } from './apps/api/src/lib/db.js';
import { salesOrders } from './src/db/schema/core.js';
import { desc } from 'drizzle-orm';

async function main() {
  const saleRows = await db.query.salesOrders.findMany({
    orderBy: [desc(salesOrders.updatedAt)],
    limit: 5,
    with: { items: true },
  });
  
  const payloads = saleRows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    items: row.items.map((i) => ({
      id: i.id,
      name: i.name,
    }))
  }));
  
  console.log(JSON.stringify(payloads, null, 2));
  process.exit(0);
}
main();
