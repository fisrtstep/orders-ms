import pool from '../db/pool.js';

export async function upsertCustomer({ userId, email, fullName }) {
    await pool.query(
        `INSERT INTO customers (user_id, email, full_name) VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET email = $2, full_name = $3`,
        [userId, email, fullName],
    );
}

export async function findCustomer(userId) {
    const { rows } = await pool.query('SELECT user_id, email, full_name FROM customers WHERE user_id = $1', [userId]);
    return rows[0] ?? null;
}
