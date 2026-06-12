import { db } from './apps/api/src/lib/db.js';
import { salesOrders } from './src/db/schema/core.js';
import { eq } from 'drizzle-orm';

async function main() {
  const result = await db.query.salesOrders.findFirst({
    where: eq(salesOrders.id, '775a11b9-b04b-4306-a0b7-92c1e84a3328'),
    with: { items: true }
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
main();
