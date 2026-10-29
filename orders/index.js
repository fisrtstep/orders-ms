import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { publish } from '../lib/events.js';
import { findCustomer } from '../customers/repository.js';
import { toOrderDto } from './dto.js';
import { listForUser, getForUser, cancel } from './repository.js';

const ordersRouter = express.Router();
ordersRouter.use(requireAuth);

// GET /orders/me -> { items: Order[] }
ordersRouter.get('/me', async (req, res, next) => {
    try {
        const [rows, customer] = await Promise.all([listForUser(req.userId), findCustomer(req.userId)]);
        res.json({ items: rows.map((r) => toOrderDto(r, customer)) });
    } catch (err) {
        next(err);
    }
});

// GET /orders/:id -> Order (own orders only)
ordersRouter.get('/:id', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
        const row = await getForUser(id, req.userId);
        if (!row) return res.status(404).json({ error: 'Order not found' });
        res.json(toOrderDto(row, await findCustomer(req.userId)));
    } catch (err) {
        next(err);
    }
});

// POST /orders/:id/cancel -> Order
// Publishes `order.cancelled` so catalog-ms restocks the lines.
ordersRouter.post('/:id/cancel', async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
        const row = await cancel(id, req.userId);
        if (!row) {
            const existing = await getForUser(id, req.userId);
            if (!existing) return res.status(404).json({ error: 'Order not found' });
            return res.status(409).json({ error: 'Order cannot be cancelled', status: existing.status });
        }
        await publish('order.cancelled', {
            orderId: row.id,
            userId: row.user_id,
            lines: row.lines.map((l) => ({ productId: l.product_id, quantity: l.quantity })),
        });
        res.json(toOrderDto(row, await findCustomer(req.userId)));
    } catch (err) {
        next(err);
    }
});

export default ordersRouter;
