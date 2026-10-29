import { subscribe, publish } from '../lib/events.js';
import { upsertCustomer } from '../customers/repository.js';
import { createFromCheckout } from '../orders/repository.js';

export async function startConsumers() {
    await subscribe('orders-ms.events', {
        // { checkoutId, userId, invoiceId, total, currency, lines: [{ productId, sku, description, quantity, unitPrice }] }
        'cart.checked_out': async (data) => {
            const order = await createFromCheckout({
                checkoutId: data.checkoutId,
                userId: data.userId,
                invoiceId: data.invoiceId,
                totalCents: Math.round(data.total * 100),
                currency: data.currency,
                lines: data.lines.map((l) => ({
                    productId: l.productId,
                    sku: l.sku,
                    name: l.description,
                    quantity: l.quantity,
                    unitPriceCents: Math.round(l.unitPrice * 100),
                })),
            });
            if (!order) return; // already recorded (redelivery)
            await publish('order.placed', {
                orderId: order.id,
                userId: order.user_id,
                total: order.total_cents / 100,
                currency: order.currency,
                placedAt: order.placed_at,
            });
        },
        // { id, email, fullName, role }
        'user.registered': (data) => upsertCustomer({ userId: data.id, email: data.email, fullName: data.fullName }),
    });
}
