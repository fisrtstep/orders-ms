-- Local read model of iam-ms users, filled from `user.registered` events.
CREATE TABLE customers (
    user_id INTEGER PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    checkout_id UUID NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    invoice_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'placed',
    total_cents INTEGER NOT NULL,
    currency TEXT NOT NULL,
    placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    cancelled_at TIMESTAMPTZ
);

CREATE INDEX orders_user_id_idx ON orders (user_id);

CREATE TABLE order_lines (
    order_id INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    PRIMARY KEY (order_id, product_id)
);
