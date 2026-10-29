import pool from '../db/pool.js';

const COLUMNS = 'id, user_id, invoice_id, status, total_cents, currency, placed_at, cancelled_at';

async function withLines(orders) {
    if (orders.length === 0) return orders;
    const { rows } = await pool.query(
        'SELECT order_id, product_id, sku, name, quantity, unit_price_cents FROM order_lines WHERE order_id = ANY($1) ORDER BY product_id',
        [orders.map((o) => o.id)],
    );
    return orders.map((o) => ({ ...o, lines: rows.filter((l) => l.order_id === o.id) }));
}

export async function listForUser(userId) {
    const { rows } = await pool.query(`SELECT ${COLUMNS} FROM orders WHERE user_id = $1 ORDER BY id DESC`, [userId]);
    return withLines(rows);
}

export async function getForUser(id, userId) {
    const { rows } = await pool.query(`SELECT ${COLUMNS} FROM orders WHERE id = $1 AND user_id = $2`, [id, userId]);
    return (await withLines(rows))[0] ?? null;
}

// Creates the order for a checkout. Returns the new order, or null if this checkout was already recorded.
export async function createFromCheckout({ checkoutId, userId, invoiceId, totalCents, currency, lines }) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            `INSERT INTO orders (checkout_id, user_id, invoice_id, total_cents, currency) VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (checkout_id) DO NOTHING RETURNING ${COLUMNS}`,
            [checkoutId, userId, String(invoiceId), totalCents, currency],
        );
        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }
        const order = rows[0];
        for (const l of lines) {
            await client.query(
                'INSERT INTO order_lines (order_id, product_id, sku, name, quantity, unit_price_cents) VALUES ($1, $2, $3, $4, $5, $6)',
                [order.id, l.productId, l.sku, l.name, l.quantity, l.unitPriceCents],
            );
        }
        await client.query('COMMIT');
        return order;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

// Moves a placed order to cancelled. Returns the cancelled order, or null if it was not cancellable.
export async function cancel(id, userId) {
    const { rows } = await pool.query(
        `UPDATE orders SET status = 'cancelled', cancelled_at = now()
         WHERE id = $1 AND user_id = $2 AND status = 'placed' RETURNING ${COLUMNS}`,
        [id, userId],
    );
    return (await withLines(rows))[0] ?? null;
}
