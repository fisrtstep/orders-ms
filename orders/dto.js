export function toOrderDto(row, customer = null) {
    return {
        id: row.id,
        userId: row.user_id,
        customer: customer ? { name: customer.full_name, email: customer.email } : null,
        status: row.status,
        invoiceId: row.invoice_id,
        total: row.total_cents / 100,
        currency: row.currency,
        placedAt: row.placed_at,
        cancelledAt: row.cancelled_at,
        lines: row.lines.map((l) => ({
            productId: l.product_id,
            sku: l.sku,
            name: l.name,
            quantity: l.quantity,
            unitPrice: l.unit_price_cents / 100,
        })),
    };
}
