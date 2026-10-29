# orders-ms

Order history and cancellation, built from checkout events. Part of the Cross-Repo Review test system (iam-ms, catalog-ms, cart-ms, orders-ms, invoices).

## Provides

| Contract | Kind | Used by |
| --- | --- | --- |
| `GET /orders/me` → `{ items: Order[] }` | HTTP | clients |
| `GET /orders/:id` → `{ id, userId, customer, status, invoiceId, total, currency, placedAt, cancelledAt, lines }` | HTTP | clients |
| `POST /orders/:id/cancel` → Order, or `409` if not `placed` | HTTP | clients |
| `order.placed` `{ orderId, userId, total, currency, placedAt }` | Event (published) | iam-ms |
| `order.cancelled` `{ orderId, userId, lines[{ productId, quantity }] }` | Event (published) | catalog-ms |

## Consumes

| Contract | From | Where |
| --- | --- | --- |
| `POST /auth/verify` | iam-ms | `lib/iamClient.js`, `middleware/requireAuth.js` |
| `cart.checked_out` → creates the order (once per `checkoutId`) | cart-ms | `events/consumers.js` (queue `orders-ms.events`) |
| `user.registered` → `customers` read model | iam-ms | `events/consumers.js` |
| Env vars `IAM_BASE_URL`, `RABBITMQ_URL` | deployment | `lib/iamClient.js`, `lib/events.js` |

## Events

Async events go over the RabbitMQ topic exchange `shop.events` (routing key = event type, envelope `{ id, type, source, occurredAt, data }`). See `lib/events.js`. Messages a handler fails on are dead-lettered to `orders-ms.events.dlq`.

## Run

```bash
docker run -d --name rabbitmq -p 5672:5672 rabbitmq:3-alpine   # shared event broker
cp .env.example .env
npm install
npm run migrate
npm start
```
